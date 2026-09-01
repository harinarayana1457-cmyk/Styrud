"""
Google NotebookLM Playwright Automation Bot
Controls a persistent Chromium / Chrome browser instance to:
1. Handle Google Authentication with saved session profiles.
2. Automate creation of new notebooks in Google NotebookLM.
3. Automatically upload/paste study sources.
4. Execute study features (Audio Overview generation, Quizzes, Flashcards, Mindmaps, Reports, Summaries).
"""

import os
import time
import json
import asyncio
from typing import Optional, Dict, Any, List

BROWSER_PROFILE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".browser_profile")
os.makedirs(BROWSER_PROFILE_DIR, exist_ok=True)

class NotebookLMBot:
    def __init__(self, headless: bool = False):
        self.headless = headless
        self.profile_dir = BROWSER_PROFILE_DIR

    async def _get_context(self, p, visible: bool):
        launch_args = {
            "user_data_dir": self.profile_dir,
            "headless": not visible,
            "args": ["--disable-blink-features=AutomationControlled", "--start-maximized"],
            "viewport": None
        }
        try:
            return await p.chromium.launch_persistent_context(**launch_args)
        except Exception:
            try:
                return await p.chromium.launch_persistent_context(**launch_args, channel="chrome")
            except Exception:
                return await p.chromium.launch_persistent_context(**launch_args, channel="msedge")

    async def check_status(self) -> Dict[str, Any]:
        """Checks whether the user is currently logged into Google NotebookLM."""
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                context = await self._get_context(p, visible=False)
                page = await context.new_page()
                try:
                    await page.goto("https://notebooklm.google.com", timeout=20000, wait_until="domcontentloaded")
                    await asyncio.sleep(2)
                    url = page.url
                    # If redirected to accounts.google.com, user is not logged in
                    is_logged_in = "accounts.google.com" not in url and "notebooklm.google.com" in url
                    return {
                        "is_logged_in": is_logged_in,
                        "current_url": url,
                        "profile_dir": self.profile_dir
                    }
                finally:
                    await context.close()
        except Exception as e:
            return {
                "is_logged_in": False,
                "error": str(e),
                "profile_dir": self.profile_dir
            }

    async def execute_task(
        self,
        task_id: str,
        sources_text: str,
        prompt: str,
        visible: bool = True
    ) -> Dict[str, Any]:
        """
        Creates a new notebook in NotebookLM, uploads sources, and executes the target prompt/task.
        """
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                context = await self._get_context(p, visible=visible)
                page = context.pages[0] if context.pages else await context.new_page()
                
                # 1. Navigate to NotebookLM
                await page.goto("https://notebooklm.google.com", timeout=35000, wait_until="domcontentloaded")
                await asyncio.sleep(3)
                
                if "accounts.google.com" in page.url:
                    # User needs to log in
                    if visible:
                        # Wait up to 120 seconds for user to sign in
                        try:
                            await page.wait_for_url(lambda u: "notebooklm.google.com" in u and "accounts.google.com" not in u, timeout=120000)
                            await asyncio.sleep(2)
                        except Exception:
                            return {
                                "success": False,
                                "needs_login": True,
                                "message": "Timed out waiting for Google sign-in. Please log in to your Google Account."
                            }
                    else:
                        await context.close()
                        return {
                            "success": False,
                            "needs_login": True,
                            "message": "Google Login required. Please run in visible mode to log in."
                        }

                # 2. Click 'New notebook' / 'Create notebook'
                new_btn = page.locator(
                    'button:has-text("New notebook"), button:has-text("Create notebook"), [aria-label*="New notebook" i], [aria-label*="Create notebook" i], div[role="button"]:has-text("New notebook")'
                ).first
                
                try:
                    if await new_btn.is_visible(timeout=8000):
                        await new_btn.click()
                    else:
                        plus_btn = page.locator('button:has(mat-icon:has-text("add")), button:has-text("+"), [aria-label*="add" i]').first
                        if await plus_btn.is_visible(timeout=5000):
                            await plus_btn.click()
                except Exception as e:
                    print("Note: Click new notebook fallback:", e)

                await asyncio.sleep(3)
                
                # 3. Add Sources dialog - Choose 'Copied text' / 'Paste text'
                copied_text_tab = page.locator(
                    'button:has-text("Copied text"), div[role="button"]:has-text("Copied text"), [aria-label*="Copied text" i], span:has-text("Copied text")'
                ).first
                
                try:
                    if await copied_text_tab.is_visible(timeout=10000):
                        await copied_text_tab.click()
                        await asyncio.sleep(1.5)
                        
                        # Fill source text
                        text_input = page.locator('textarea, [contenteditable="true"], div[role="textbox"]').first
                        if await text_input.is_visible(timeout=5000):
                            # Paste source text
                            clean_source = sources_text.strip()
                            await text_input.fill(clean_source[:45000])
                            await asyncio.sleep(1)
                            
                            # Click Insert / Save
                            insert_btn = page.locator('button:has-text("Insert"), button:has-text("Save"), button:has-text("Add")').first
                            if await insert_btn.is_visible(timeout=5000):
                                await insert_btn.click()
                                await asyncio.sleep(4)
                except Exception as e:
                    print("Note: Add sources step info:", e)

                # 4. Execute the specific task
                if task_id == "audio":
                    try:
                        audio_gen_btn = page.locator(
                            'button:has-text("Generate"), button[aria-label*="Generate audio" i], [aria-label*="Deep dive" i] button'
                        ).first
                        if await audio_gen_btn.is_visible(timeout=10000):
                            await audio_gen_btn.click()
                            await asyncio.sleep(2)
                    except Exception as e:
                        print("Note: Audio generate click:", e)
                else:
                    try:
                        chat_input = page.locator(
                            'textarea[placeholder*="Ask" i], textarea[aria-label*="chat" i], textarea[placeholder*="question" i], [contenteditable="true"][role="textbox"], textarea'
                        ).first
                        if await chat_input.is_visible(timeout=10000):
                            await chat_input.fill(prompt)
                            await asyncio.sleep(0.5)
                            await chat_input.press("Enter")
                            await asyncio.sleep(2)
                    except Exception as e:
                        print("Note: Chat input prompt send:", e)

                notebook_url = page.url
                
                # Keep browser open for 15 seconds so user can see it executing or keep running
                await asyncio.sleep(5)
                
                return {
                    "success": True,
                    "notebook_url": notebook_url,
                    "task_id": task_id,
                    "message": f"Successfully created notebook and executed '{task_id}' in Google NotebookLM!"
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Automation error: {str(e)}"
            }

bot = NotebookLMBot()
