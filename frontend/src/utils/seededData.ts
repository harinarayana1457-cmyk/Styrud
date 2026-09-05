/**
 * Built-in Client-Side Study Dataset and Resilient Data Generator
 * Provides zero-downtime offline execution for Vercel static deployments.
 */

export interface SourceAsset {
  id: string;
  title: string;
  name: string;
  type: string;
  size: number;
  preview: string;
  content: string;
  content_preview: string;
  created_at: string;
  word_count?: number;
}

export const DEFAULT_ASSETS: SourceAsset[] = [
  {
    id: "lecture-01",
    title: "VIT-AP Lecture 1: Microprocessors & Computer Generations.pdf",
    name: "VIT-AP Lecture 1: Microprocessors & Computer Generations.pdf",
    type: "pdf",
    size: 245760,
    created_at: "2026-09-01T10:00:00Z",
    word_count: 850,
    content_preview: "VIT-AP University Course: Microprocessors and Computer Architecture. Covers ENIAC, Transistors, SSI/MSI/LSI/VLSI generations, CPU internals (ALU, CU, Registers), and fundamental bus topology.",
    preview: "VIT-AP University Course: Microprocessors and Computer Architecture. Covers ENIAC, Transistors, SSI/MSI/LSI/VLSI generations, CPU internals (ALU, CU, Registers), and fundamental bus topology.",
    content: `# VIT-AP University
## Course: Microprocessors & Computer Architecture
### Lecture 1: Introduction to Microprocessors & Computer Generations

1. Evolution of Computing Generations:
- 1st Generation (1940s-1950s): Vacuum Tubes (ENIAC, UNIVAC). Massive power draw, heat generation, limited reliability.
- 2nd Generation (1950s-1960s): Discrete Transistors. Drastic reduction in physical size, higher switching speeds.
- 3rd Generation (1960s-1970s): Integrated Circuits (SSI & MSI). Dozens to hundreds of transistors per silicon wafer.
- 4th Generation (1971-Present): LSI & VLSI Microprocessors. Single-chip Central Processing Unit (Intel 4004, 8085, 8086, x86).
- 5th Generation (Emerging): ULSI Microcontrollers, Multi-Core Parallel Architectures, Quantum & Neuromorphic AI silicon.

2. Microprocessor Internal Subsystems:
- Arithmetic Logic Unit (ALU): Executes integer arithmetic, binary logic operations, shifts, and comparisons.
- Control Unit (CU): Decodes binary machine opcodes, sequences micro-operations, and generates timing strobe signals (RD, WR).
- Register Array: Ultra-high-speed temporary storage including Accumulator, Program Counter (PC), Stack Pointer (SP), and General Purpose Registers (B, C, D, E, H, L).

3. Microprocessor vs. Microcontroller:
- Microprocessor: Standalone CPU fabricated on a single IC chip. Requires external RAM, ROM, Timers, and I/O interface chips (e.g., 8255 PPI).
- Microcontroller: Monolithic System-on-Chip (SoC) integrating CPU, RAM, Flash ROM, Timers, Interrupt Controllers, and GPIO ports on a single silicon die designed for dedicated embedded control.`
  },
  {
    id: "lecture-02",
    title: "VIT-AP Lecture 2: Evolution, Bus Architectures & Embedded Systems.pdf",
    name: "VIT-AP Lecture 2: Evolution, Bus Architectures & Embedded Systems.pdf",
    type: "pdf",
    size: 312500,
    created_at: "2026-09-02T14:30:00Z",
    word_count: 1120,
    content_preview: "Covers 3-phase instruction execution cycle (Fetch, Decode, Execute), Data/Address/Control bus mechanics, memory addressability limits, and embedded applications.",
    preview: "Covers 3-phase instruction execution cycle (Fetch, Decode, Execute), Data/Address/Control bus mechanics, memory addressability limits, and embedded applications.",
    content: `# VIT-AP University
## Course: Microprocessors & Computer Architecture
### Lecture 2: Evolution, Bus Architectures & Embedded Systems

1. Instruction Execution Cycle:
- Phase 1: Instruction Fetch: Program Counter (PC) places target 16-bit address on the Address Bus. Control Unit asserts Read (RD=0). Memory responds by placing the instruction opcode byte onto the Data Bus. Opcode is latched into the Instruction Register (IR), and PC increments.
- Phase 2: Instruction Decode: Control Unit decoder logic analyzes opcode bit patterns, resolves addressing modes, and configures internal data pathways.
- Phase 3: Execute & Writeback: ALU carries out arithmetic/logical transformation (e.g. ADD B -> A = A + B). Flags register (Zero, Sign, Parity, Carry, Aux Carry) updates. Result is written to registers or external RAM.

2. Three-Bus Architecture Hierarchy:
- Address Bus: Unidirectional from CPU to Memory/Peripherals. A bus width of N address lines addresses a physical memory space of 2^N bytes (e.g. 16 lines = 64 KB; 20 lines = 1 MB; 32 lines = 4 GB; 64 lines = 16 EB).
- Data Bus: Bidirectional highway carrying operand data and opcode bytes between CPU and RAM/ROM/IO devices. Bus width determines native processor bitness (8-bit, 16-bit, 32-bit, 64-bit).
- Control Bus: Hybrid transmission group carrying synchronization and handshaking signals including Memory Read (MEMR), Memory Write (MEMW), I/O Read (IOR), I/O Write (IOW), Clock, Reset, and Interrupt Requests (INTR, NMI).

3. Embedded System Domain Classification:
- Automotive: Electronic Control Units (ECUs), Anti-lock Braking Systems (ABS), Adaptive Cruise Control, Engine Management.
- Healthcare & Biomedical: Electrocardiogram (ECG) monitors, automated insulin infusion pumps, pulse oximeters.
- Industrial Robotics: Programmable Logic Controllers (PLCs), CNC milling machines, SCADA telemetry.
- Consumer Electronics: Smart home IoT gateways, automated drones, high-efficiency appliances.`
  }
];

/**
 * Packages active workspace sources into clean formatted text.
 */
export function exportClientSources(
  assetId?: string | null,
  assets: SourceAsset[] = DEFAULT_ASSETS
): { filename: string; content: string; assets_count: number; notebooklm_url: string } {
  const activeList = assetId
    ? assets.filter(a => a.id === assetId)
    : assets;
  
  const targetList = activeList.length > 0 ? activeList : DEFAULT_ASSETS;

  let content = `================================================================================\n`;
  content += `STYRUD AUTONOMOUS STUDY GALAXY: SOURCE PACKAGE FOR GOOGLE NOTEBOOKLM\n`;
  content += `Total Documents: ${targetList.length}\n`;
  content += `Generated: ${new Date().toISOString()}\n`;
  content += `================================================================================\n\n`;

  targetList.forEach((asset, idx) => {
    content += `--- [SOURCE ${idx + 1} OF ${targetList.length}]: ${asset.name} ---\n`;
    content += `Type: ${asset.type.toUpperCase()} | Size: ${(asset.size / 1024).toFixed(1)} KB\n\n`;
    content += `${asset.content || asset.preview || 'No content'}\n\n`;
    content += `--------------------------------------------------------------------------------\n\n`;
  });

  const filename = targetList.length === 1
    ? `Styrud_${targetList[0].name.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`
    : `Styrud_NotebookLM_All_Sources.txt`;

  return {
    filename,
    content,
    assets_count: targetList.length,
    notebooklm_url: 'https://notebooklm.google.com'
  };
}

/**
 * Safe JSON fetch helper that gracefully falls back when Vercel returns HTML or 404
 */
export async function safeFetchJson<T>(url: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return fallback;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        return fallback;
      }
    }
    return await res.json() as T;
  } catch (err) {
    console.warn(`safeFetchJson fallback on ${url}:`, err);
    return fallback;
  }
}

/**
 * Comprehensive fallback data generator for all 10 visualizers
 */
export function getSeededData(toolType: string): any {
  switch (toolType) {
    case 'summary':
      return {
        summary: `# 📑 Executive Study Brief: Microprocessors & Computer Architecture

## 🎯 Executive Overview
This course material delivers a systematic breakdown of computer evolution, microprocessor micro-architectures, instruction execution cycles, and embedded system design paradigms across academic curriculum standards.

---

## 🏛️ Core Pillars of Understanding

### 1. The 5 Generations of Computing Hardware
* **1st Generation (1940s-1950s)**: Vacuum Tubes (ENIAC, UNIVAC). Characterized by high thermal dissipation, low mean time between failures (MTBF), and mechanical programming.
* **2nd Generation (1950s-1960s)**: Discrete Transistors. Introduced solid-state electronics, lower power requirements, and magnetic core memories.
* **3rd Generation (1960s-1970s)**: SSI & MSI Integrated Circuits. Unified multiple gates on single silicon dies, reducing propagation delay.
* **4th Generation (1971-Present)**: LSI & VLSI Microprocessors. Single-chip CPUs (Intel 4004, 8085, 8086, ARM, x86-64).
* **5th Generation (Modern/Emerging)**: Ultra Large Scale Integration (ULSI), Heterogeneous Multi-Core, Neuromorphic AI Co-Processors.

### 2. Standalone Microprocessor vs. Integrated Microcontroller
* **Microprocessor (MPU)**: Dedicated CPU core containing ALU, Control Unit, and Registers fabricated via LSI. Requires external RAM, ROM, Timers, and I/O peripheral controllers.
* **Microcontroller (MCU)**: Monolithic System-on-Chip (SoC) fabricated via VLSI, housing CPU, RAM, Flash Memory, Timers, and GPIO ports directly on a single silicon substrate.

### 3. The 3-Phase Instruction Execution Machine Cycle
$$\\text{Fetch} \\longrightarrow \\text{Decode} \\longrightarrow \\text{Execute}$$
1. **Fetch**: Program Counter (PC) presents target memory address to Address Bus. Control Unit asserts Read signal ($\\text{RD}=0$). Memory transmits opcode byte across Data Bus into Instruction Register (IR).
2. **Decode**: Control Unit decoding matrix translates opcode bit pattern into discrete control micro-signals.
3. **Execute & Writeback**: ALU performs integer calculation or logical operation; status flags update; result writes back to accumulator or external memory.

### 4. System Bus Topology & Mathematical Limits
* **Address Bus ($N$ lines)**: Unidirectional ($CPU \\rightarrow \\text{Memory}$). Maximum addressable memory space is strictly:
  $$\\text{Addressable Bytes} = 2^N$$
  *(e.g., 16-bit = 64 KB, 20-bit = 1 MB, 32-bit = 4 GB, 64-bit = 16 Exabytes)*.
* **Data Bus ($M$ lines)**: Bidirectional highway transferring data words and instruction opcodes.
* **Control Bus**: Carries synchronization signals (MEMR, MEMW, IOR, IOW, Clock, Reset, INTR).`
      };

    case 'report':
      return {
        report: `# 🔬 Academic Deep Dive: Microprocessor Architecture & Embedded Systems

**Author:** Styrud Autonomous Knowledge Engine  
**Affiliation:** Computer Science & Electrical Engineering Curriculum  
**Status:** Grounded Research Report  

---

## 1. Abstract
The transition from discrete vacuum-tube logic to high-density VLSI microprocessors represents the cornerstone of modern computational engineering. This paper synthesizes the architectural mechanics governing Central Processing Units (CPUs), instruction decoding cycles, three-bus interconnection topologies, and dedicated microcontroller applications.

---

## 2. Microprocessor Architecture & Functional Subsystems

The microprocessor comprises three tightly coupled primary functional units:

$$\\text{Microprocessor} = \\text{ALU} + \\text{Control Unit} + \\text{Register Array}$$

\`\`\`
+-------------------------------------------------------------+
|                     MICROPROCESSOR CORE                     |
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   | Arithmetic Logic Unit |     |     Control Unit      |   |
|   |        (ALU)          |     | (Opcode Decoders & CU)|   |
|   +-----------+-----------+     +-----------+-----------+   |
|               |                             |               |
|   +-----------+-----------------------------+-----------+   |
|   |                      Register Array                 |   |
|   |  (Accumulator, PC, SP, Status Flags, Gen Purpose)   |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
\`\`\`

1. **Arithmetic Logic Unit (ALU)**: Executes binary arithmetic (addition, subtraction) and Boolean operations (AND, OR, XOR, NOT, shift, rotate).
2. **Control Unit (CU)**: Interprets machine instructions, coordinates multiplexer routing, and asserts synchronized timing strobes.
3. **Internal Register Array**: High-frequency silicon storage elements providing single-cycle operand access.

---

## 3. Microprocessor vs. Microcontroller Comparison

| Parameter | Standalone Microprocessor (e.g., 8085, 8086, Core i7) | Integrated Microcontroller (e.g., 8051, PIC, STM32) |
|---|---|---|
| **Primary Focus** | General-purpose high-throughput computing | Dedicated real-time embedded control |
| **Silicon Integration** | CPU Core only (ALU, CU, Registers) | CPU + RAM + ROM + Timers + ADC + GPIO |
| **External Components** | Requires external RAM, ROM, I/O chips | Self-contained single-chip operation |
| **Cost & Board Footprint** | Higher complexity, larger PCB area | Compact footprint, low Bill of Materials (BOM) |
| **Power Consumption** | Moderate to high power consumption | Ultra-low power / battery-optimized |

---

## 4. The Instruction Execution Pipeline

Every machine instruction undergoes a rigorous 3-stage temporal sequence:
1. **Fetch**:
   * Address latching: $Address \\leftarrow PC$
   * Read assertion: $MEMR \\leftarrow 0$
   * Opcode transfer: $IR \\leftarrow Data Bus$
   * Program Counter auto-increment: $PC \\leftarrow PC + 1$
2. **Decode**:
   * Instruction decoder generates control lines corresponding to opcode bit flags.
3. **Execute**:
   * Operands routed into ALU inputs. Arithmetic or logical transfer computed. Status flags updated.`
      };

    case 'quiz':
      return {
        quiz: [
          {
            id: 1,
            question: "Which component inside a microprocessor is responsible for decoding binary opcodes and generating control strobes?",
            options: [
              "Arithmetic Logic Unit (ALU)",
              "Control Unit (CU)",
              "Stack Pointer (SP)",
              "Accumulator (A)"
            ],
            correct_index: 1,
            explanation: "The Control Unit (CU) decodes the binary machine instruction fetched into the Instruction Register and sequences the micro-operations and timing strobes (RD, WR) for the rest of the CPU."
          },
          {
            id: 2,
            question: "If a microprocessor has a 20-bit wide Address Bus, what is its maximum directly addressable physical memory capacity?",
            options: [
              "64 Kilobytes (64 KB)",
              "1 Megabyte (1 MB)",
              "16 Megabytes (16 MB)",
              "4 Gigabytes (4 GB)"
            ],
            correct_index: 1,
            explanation: "Addressable memory capacity equals 2^N bytes, where N is the bus width. 2^20 bytes = 1,048,576 bytes = exactly 1 MB (as seen in the Intel 8086)."
          },
          {
            id: 3,
            question: "What is the primary technological difference between a Microprocessor and a Microcontroller?",
            options: [
              "Microprocessors can only process 4-bit data words.",
              "Microcontrollers integrate CPU, RAM, ROM, Timers, and I/O ports on a single monolithic chip.",
              "Microprocessors do not possess an ALU or Control Unit.",
              "Microcontrollers cannot execute assembly instructions."
            ],
            correct_index: 1,
            explanation: "A microprocessor is a standalone CPU requiring external memory and peripherals, whereas a microcontroller is a complete System-on-Chip (SoC) containing CPU, RAM, Flash, Timers, and I/O on a single silicon die."
          },
          {
            id: 4,
            question: "Which computer hardware generation was the first to introduce LSI single-chip microprocessors?",
            options: [
              "1st Generation (Vacuum Tubes)",
              "2nd Generation (Transistors)",
              "3rd Generation (SSI/MSI Integrated Circuits)",
              "4th Generation (LSI/VLSI Microprocessors)"
            ],
            correct_index: 3,
            explanation: "The 4th Generation (beginning with the Intel 4004 in 1971) leveraged Large Scale Integration (LSI) to place the entire CPU on a single silicon wafer."
          },
          {
            id: 5,
            question: "Why is the Address Bus unidirectional while the Data Bus is bidirectional?",
            options: [
              "Address Bus transfers power voltages, while Data Bus transfers ground signals.",
              "The CPU exclusively dictates target memory addresses to peripherals, while data must travel both to and from the CPU.",
              "The Address Bus is analog while the Data Bus is digital.",
              "The Address Bus operates at double the clock speed of the Data Bus."
            ],
            correct_index: 1,
            explanation: "The Address Bus is unidirectional because the CPU exclusively controls and specifies where memory read/write cycles occur. The Data Bus is bidirectional because the CPU must both read data from memory and write data back to memory."
          }
        ]
      };

    case 'flashcards':
      return {
        flashcards: [
          {
            id: 1,
            front: "What are the three essential functional units inside a Microprocessor?",
            back: "1) Arithmetic Logic Unit (ALU): Computes math & Boolean logic.\n2) Control Unit (CU): Decodes instructions & coordinates timing.\n3) Register Array: Ultra-fast temporary storage (Accumulator, PC, SP).",
            mastered: false
          },
          {
            id: 2,
            front: "How do you calculate the maximum memory capacity addressable by an N-bit Address Bus?",
            back: "Maximum Memory = 2^N bytes.\n\n• 16-bit: 2^16 = 64 KB\n• 20-bit: 2^20 = 1 MB\n• 32-bit: 2^32 = 4 GB\n• 64-bit: 2^64 = 16 Exabytes",
            mastered: false
          },
          {
            id: 3,
            front: "Explain the 3 phases of the Instruction Cycle.",
            back: "1. Fetch: PC sends address, RD asserted, opcode loaded into IR.\n2. Decode: CU translates opcode into discrete micro-signals.\n3. Execute: ALU computes operation and writes back result.",
            mastered: false
          },
          {
            id: 4,
            front: "Microprocessor vs. Microcontroller: Key Distinction",
            back: "• Microprocessor: Standalone CPU (requires external RAM, ROM, IO).\n• Microcontroller: Monolithic SoC (CPU + RAM + ROM + Timers + IO on one chip).",
            mastered: false
          },
          {
            id: 5,
            front: "What are the 3 buses in computer bus architecture?",
            back: "1. Address Bus: Unidirectional (CPU -> Memory), selects memory cells.\n2. Data Bus: Bidirectional, transfers data words.\n3. Control Bus: Carries timing strobes (MEMR, MEMW, IOR, IOW, Clock, Reset).",
            mastered: false
          },
          {
            id: 6,
            front: "What role does the Program Counter (PC) register serve?",
            back: "The Program Counter (PC) holds the memory address of the next instruction to be fetched. It auto-increments after every fetch cycle.",
            mastered: false
          },
          {
            id: 7,
            front: "List the 5 Computer Generations and their active switching components.",
            back: "1st Gen: Vacuum Tubes (ENIAC)\n2nd Gen: Discrete Transistors\n3rd Gen: SSI / MSI Integrated Circuits\n4th Gen: LSI / VLSI Microprocessors\n5th Gen: ULSI, AI Silicon & Multi-Core",
            mastered: false
          },
          {
            id: 8,
            front: "What are 3 major domain applications of Embedded Systems?",
            back: "1. Automotive: Engine ECUs, ABS, Airbag controllers.\n2. Medical: Digital ECG monitors, Insulin pumps, Ventilators.\n3. Industrial: PLC controllers, Robotics, SCADA automation.",
            mastered: false
          }
        ]
      };

    case 'slides':
      return {
        slides: [
          {
            slide_number: 1,
            title: "Microprocessors & Computer Generations",
            subtitle: "Architectural Foundations & Historical Evolution",
            bullets: [
              "Evolution from Vacuum Tubes to ULSI Silicon",
              "Microprocessor Subsystems: ALU, CU, Registers",
              "Standalone Microprocessor vs. Integrated Microcontroller",
              "Grounded in Academic Curriculum Standards"
            ],
            visual_cue: "Computer evolution timeline from 1940s vacuum tubes to 2026 AI processors."
          },
          {
            slide_number: 2,
            title: "5 Generations of Computing Hardware",
            subtitle: "The Solid-State Revolution",
            bullets: [
              "1st Gen: Vacuum Tubes (ENIAC, High Heat & Power)",
              "2nd Gen: Transistors (Miniaturization & Reliability)",
              "3rd Gen: SSI/MSI ICs (Dozens of gates on single wafer)",
              "4th Gen: LSI/VLSI (Single-chip CPU: Intel 4004/8085/8086)",
              "5th Gen: ULSI, Multi-Core & Neuromorphic AI Silicon"
            ],
            visual_cue: "Diagram illustrating density increase across silicon transistor eras."
          },
          {
            slide_number: 3,
            title: "Microprocessor Core Anatomy",
            subtitle: "ALU, Control Unit & Register Hierarchy",
            bullets: [
              "Arithmetic Logic Unit (ALU): Computes binary math & logic",
              "Control Unit (CU): Opcode decoding & timing generation",
              "Accumulator & General Registers: High-speed temporary storage",
              "Program Counter (PC) & Stack Pointer (SP) pointers"
            ],
            visual_cue: "Internal CPU block diagram linking ALU, CU, Register Array, and Internal Bus."
          },
          {
            slide_number: 4,
            title: "The 3-Phase Machine Cycle",
            subtitle: "Fetch ➔ Decode ➔ Execute",
            bullets: [
              "Fetch: Address placed on bus, MEMR strobed, opcode latched",
              "Decode: Control Unit generates internal gate control signals",
              "Execute: ALU computation performed, flags and registers updated",
              "Pipelining enables overlapping instruction execution"
            ],
            visual_cue: "Animated step-by-step state machine transition diagram."
          },
          {
            slide_number: 5,
            title: "System Bus Topology",
            subtitle: "Address, Data & Control Pathways",
            bullets: [
              "Address Bus: Unidirectional (CPU -> Memory), size = 2^N bytes",
              "Data Bus: Bidirectional, width determines word bitness",
              "Control Bus: Synchronization (MEMR, MEMW, IOR, IOW, Clock)",
              "Tri-state buffers isolate inactive peripherals"
            ],
            visual_cue: "Parallel colored bus lines linking CPU, RAM, ROM, and I/O interface."
          },
          {
            slide_number: 6,
            title: "Embedded Systems Architecture",
            subtitle: "Real-Time Monolithic Control",
            bullets: [
              "Microcontrollers integrate CPU, RAM, Flash & Peripherals",
              "Automotive: Engine ECUs, ABS, ADAS collision avoidance",
              "Medical: Cardiac monitors, automated drug infusion",
              "Industrial Automation: PLC systems and robotics"
            ],
            visual_cue: "Embedded System-on-Chip die layout diagram."
          }
        ]
      };

    case 'mindmap':
      return {
        mindmap: {
          id: "root",
          name: "Microprocessor & Embedded Systems",
          category: "Domain",
          children: [
            {
              id: "gen",
              name: "Hardware Evolution",
              category: "History",
              children: [
                { id: "gen1", name: "1st Gen: Vacuum Tubes (ENIAC)", category: "1940s" },
                { id: "gen2", name: "2nd Gen: Transistors", category: "1950s" },
                { id: "gen3", name: "3rd Gen: SSI/MSI ICs", category: "1960s" },
                { id: "gen4", name: "4th Gen: LSI Microprocessors", category: "1970s-Present" },
                { id: "gen5", name: "5th Gen: ULSI & AI Multi-Core", category: "Modern" }
              ]
            },
            {
              id: "cpu",
              name: "CPU Core Anatomy",
              category: "Architecture",
              children: [
                { id: "alu", name: "ALU (Arithmetic & Boolean Logic)", category: "Computation" },
                { id: "cu", name: "Control Unit (Decode & Timing)", category: "Sequencing" },
                { id: "reg", name: "Register Array (Acc, PC, SP, Flags)", category: "Storage" }
              ]
            },
            {
              id: "cycle",
              name: "Instruction Cycle",
              category: "Execution",
              children: [
                { id: "fetch", name: "1. Fetch (PC onto Bus, Read Strobe)", category: "Memory Read" },
                { id: "decode", name: "2. Decode (Opcode Translation)", category: "Control Logic" },
                { id: "exec", name: "3. Execute (ALU Calc & Writeback)", category: "Operation" }
              ]
            },
            {
              id: "bus",
              name: "Three-Bus Topology",
              category: "Interconnect",
              children: [
                { id: "addr_bus", name: "Address Bus (Unidirectional, 2^N Bytes)", category: "Memory Space" },
                { id: "data_bus", name: "Data Bus (Bidirectional, 8/16/32/64-Bit)", category: "Data Word" },
                { id: "ctrl_bus", name: "Control Bus (MEMR, MEMW, IOR, IOW, Clock)", category: "Signals" }
              ]
            },
            {
              id: "embedded",
              name: "Embedded Systems",
              category: "Applications",
              children: [
                { id: "mcu", name: "Microcontroller SoC (CPU+RAM+ROM+Timers)", category: "Hardware" },
                { id: "auto", name: "Automotive (ECU, ABS, Airbag)", category: "Domain" },
                { id: "med", name: "Biomedical (ECG, Insulin Pump)", category: "Domain" }
              ]
            }
          ]
        }
      };

    case 'infographic':
      return {
        infographic: {
          title: "Microprocessor Technology & Embedded Evolution",
          subtitle: "Visual breakdown of computer generations, bus mechanics, and embedded applications",
          timeline_milestones: [
            { year: "1946", title: "1st Gen: Vacuum Tubes", description: "ENIAC computer using 18,000 thermionic tubes; extreme heat and power consumption." },
            { year: "1958", title: "2nd Gen: Transistors", description: "Solid-state silicon transistors replace tubes, enabling miniature reliable computing." },
            { year: "1964", title: "3rd Gen: Integrated Circuits", description: "SSI & MSI circuits pack dozens of transistors onto silicon planar wafers." },
            { year: "1971", title: "4th Gen: Intel 4004 Microprocessor", description: "First commercial single-chip CPU fabricated with Large Scale Integration (LSI)." },
            { year: "1980+", title: "Microcontroller Revolution", description: "8051 and monolithic System-on-Chips revolutionize dedicated embedded control." },
            { year: "2026", title: "5th Gen: Neuromorphic & Multi-Core", description: "Billion-transistor heterogeneous SoCs with integrated AI accelerators." }
          ],
          stats: [
            { label: "16-Bit Address Space", value: "64 KB", description: "2^16 physical memory locations" },
            { label: "20-Bit Address Space", value: "1 MB", description: "2^20 physical memory locations (8086)" },
            { label: "32-Bit Address Space", value: "4 GB", description: "2^32 physical memory locations" },
            { label: "Instruction Cycle", value: "3 Phases", description: "Fetch -> Decode -> Execute" }
          ],
          processes: [
            { step: 1, title: "Instruction Fetch", details: "PC puts 16-bit address on bus, RD asserted, opcode transferred to IR register." },
            { step: 2, title: "Opcode Decode", details: "Control Unit decodes instruction bit pattern into discrete gating signals." },
            { step: 3, title: "ALU Execution", details: "ALU calculates arithmetic/logic operation; status flags and registers update." },
            { step: 4, title: "Result Writeback", details: "Calculated outcome stored in accumulator or written to external RAM." }
          ]
        }
      };

    case 'datatable':
      return {
        datatable: {
          title: "Microprocessor & Embedded Architecture Comparison Matrix",
          tables: [
            {
              name: "Hardware Generations Comparison",
              headers: ["Generation", "Primary Technology", "Key Characteristics", "Typical Examples"],
              rows: [
                ["1st Generation (1940-1956)", "Vacuum Tubes", "Extreme heat, large footprint, low MTBF", "ENIAC, EDVAC, UNIVAC I"],
                ["2nd Generation (1956-1963)", "Discrete Transistors", "Smaller size, lower power, magnetic core RAM", "IBM 7094, CDC 1604"],
                ["3rd Generation (1964-1971)", "SSI & MSI Integrated Circuits", "Multiple gates on single silicon die, faster clock", "IBM System/360"],
                ["4th Generation (1971-Present)", "LSI & VLSI Microprocessors", "Single-chip CPU, high clock rates, PC revolution", "Intel 4004, 8085, 8086, x86"],
                ["5th Generation (Modern)", "ULSI & Neuromorphic AI SoCs", "Multi-core, parallel computing, hardware AI", "Apple M-Series, Intel Core Ultra"]
              ]
            },
            {
              name: "Microprocessor vs. Microcontroller",
              headers: ["Feature / Parameter", "Microprocessor (MPU)", "Microcontroller (MCU)"],
              rows: [
                ["Core Concept", "Standalone Central Processing Unit", "Complete Monolithic Computer-on-a-Chip"],
                ["Internal Components", "ALU, Control Unit, Register Array only", "CPU + RAM + ROM/Flash + Timers + GPIO + ADC"],
                ["External Hardware", "Requires external RAM, ROM, I/O controllers", "Self-contained with minimal external parts"],
                ["Primary Application", "General-purpose PCs, servers, workstations", "Dedicated real-time embedded control"],
                ["Cost & Complexity", "Higher Bill of Materials (BOM) & PCB routing", "Low cost, ultra-compact PCB footprint"],
                ["Power Consumption", "High power draw (watts to tens of watts)", "Ultra-low power (milliwatts to microwatts)"]
              ]
            },
            {
              name: "Three-Bus Architecture Characteristics",
              headers: ["Bus Type", "Directionality", "Function", "Key Determining Factor"],
              rows: [
                ["Address Bus", "Unidirectional (CPU -> Memory)", "Carries memory / IO location address", "Bus width $N$ determines max address space ($2^N$)"],
                ["Data Bus", "Bidirectional", "Transfers data operands and opcodes", "Bus width defines native processor bitness (8/16/32/64-bit)"],
                ["Control Bus", "Bidirectional / Hybrid", "Carries timing strobes and control lines", "Signals include MEMR, MEMW, IOR, IOW, Clock, Reset"]
              ]
            }
          ]
        }
      };

    case 'cluster':
      return {
        nodes: [
          { id: "node-1", label: "Vacuum Tubes (1st Gen)", cluster: "History", weight: 3, group: 0 },
          { id: "node-2", label: "Transistors (2nd Gen)", cluster: "History", weight: 4, group: 0 },
          { id: "node-3", label: "Integrated Circuits (3rd Gen)", cluster: "History", weight: 5, group: 0 },
          { id: "node-4", label: "Microprocessors (4th Gen)", cluster: "History", weight: 6, group: 0 },
          { id: "node-5", label: "Arithmetic Logic Unit (ALU)", cluster: "CPU Core", weight: 5, group: 1 },
          { id: "node-6", label: "Control Unit (CU)", cluster: "CPU Core", weight: 5, group: 1 },
          { id: "node-7", label: "Register Array & PC", cluster: "CPU Core", weight: 4, group: 1 },
          { id: "node-8", label: "Instruction Fetch", cluster: "Machine Cycle", weight: 4, group: 2 },
          { id: "node-9", label: "Opcode Decode", cluster: "Machine Cycle", weight: 4, group: 2 },
          { id: "node-10", label: "ALU Execution", cluster: "Machine Cycle", weight: 4, group: 2 },
          { id: "node-11", label: "Address Bus (2^N Space)", cluster: "Bus Architecture", weight: 5, group: 3 },
          { id: "node-12", label: "Bidirectional Data Bus", cluster: "Bus Architecture", weight: 5, group: 3 },
          { id: "node-13", label: "Control Bus Signals", cluster: "Bus Architecture", weight: 4, group: 3 },
          { id: "node-14", label: "Microcontroller SoC", cluster: "Embedded Systems", weight: 5, group: 4 },
          { id: "node-15", label: "Automotive ECUs (ABS)", cluster: "Embedded Systems", weight: 4, group: 4 },
          { id: "node-16", label: "Medical ECG Monitors", cluster: "Embedded Systems", weight: 4, group: 4 }
        ],
        links: [
          { source: "node-1", target: "node-2", strength: 0.8 },
          { source: "node-2", target: "node-3", strength: 0.8 },
          { source: "node-3", target: "node-4", strength: 0.9 },
          { source: "node-4", target: "node-5", strength: 0.7 },
          { source: "node-5", target: "node-6", strength: 0.9 },
          { source: "node-5", target: "node-7", strength: 0.8 },
          { source: "node-6", target: "node-8", strength: 0.85 },
          { source: "node-8", target: "node-9", strength: 0.9 },
          { source: "node-9", target: "node-10", strength: 0.9 },
          { source: "node-8", target: "node-11", strength: 0.85 },
          { source: "node-8", target: "node-12", strength: 0.85 },
          { source: "node-9", target: "node-13", strength: 0.8 },
          { source: "node-4", target: "node-14", strength: 0.75 },
          { source: "node-14", target: "node-15", strength: 0.85 },
          { source: "node-14", target: "node-16", strength: 0.8 }
        ]
      };

    default:
      return {};
  }
}
