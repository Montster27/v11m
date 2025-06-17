# Starting Arc - Revision 2: The Blocked Mind
## Arc Overview

**Arc Title:** The Blocked Mind  
**Arc Type:** Personal Discovery/Memory Recovery  
**Arc Length:** 4 storylets  
**Time Span:** Days 1-3  
**Central Theme:** Breaking conceptual blocks to recover impossible memories and receive future instructions

### Arc Structure

**Setup (Storylet 1):** Player discovers impossible memories that feel blocked  
**First Contact (Storylet 2):** John introduces concept of mental blocks and hidden puzzle  
**Proof of Concept (Storylet 3):** Neural pathway demonstration shows what's possible  
**Choice Point (Storylet 4):** Three approaches to memory recovery lead to next arc  

### Exit Positions
- **Independent:** Solve puzzle alone, trust own investigation
- **Guided:** Accept John's mentorship through the process  
- **Cautious:** Resist until understanding risks and implications

---

## Storylet 1: Impossible Memories

**ID:** `impossible_memories`  
**Trigger:** Day 1  
**Arc Position:** Setup/Opening

### Description
You wake with detailed memories that don't belong to you - not just Childish Gambino's "Time," but specific knowledge of future events, technologies, and social changes. A mixtape labeled "Proof Lives in Experience" sits on your desk. The memories feel blocked somehow, like trying to remember a dream - the harder you focus, the more they slip away. Something is preventing full recall, as if your mind has barriers protecting you from complete knowledge.

### Choices & Effects

**Systematic Investigation**
- Effect: `analyticalApproach = true`
- Resources: Knowledge +8, Stress +10
- Tone: Treating this as a research problem

**Seek Connection** 
- Effect: `socialApproach = true`
- Resources: Social +8, Stress +10
- Tone: Finding others with similar experiences

**Test Application**
- Effect: `pragmaticApproach = true` 
- Resources: Energy +8, Stress +7
- Tone: Using 'future knowledge' practically

---

## Storylet 2: The Blocked Mind

**ID:** `john_downing_approach`  
**Trigger:** Any approach flag from Storylet 1  
**Arc Position:** First Contact

### Description
In the dining hall, a student with two bowls of Froot Loops makes deliberate eye contact. "The memories feel real but impossible, right?" he says quietly. "That's because your mind has blocks - conceptual barriers preventing full recall. Most people never break through them." He slides you a napkin with symbols drawn on it. "Terminal 7 in the computer lab has exercises designed to dissolve these blocks. But you have to solve the access puzzle first. The clues are hidden around campus - in places where impossible things feel normal."

### Choices & Effects

**Ask About Blocks**
- Effect: `askedAboutBlocks = true`
- Resources: Knowledge +5
- Tone: Understanding the mechanism

**Demand Direct Help**
- Effect: `demandedDirectHelp = true`
- Resources: Stress +8
- Tone: Impatience with complexity

**Focus on Clues**
- Effect: `focusedOnClues = true`
- Resources: Energy +5
- Tone: Ready to investigate symbols

---

## Storylet 3: The Neural Proof

**ID:** `neural_proof`  
**Trigger:** Any choice flag from Storylet 2  
**Arc Position:** Proof of Concept

### Description
John touches the napkin symbols and for a moment, your vision shifts. You see neural pathways in your mind - some bright and active, others dark and blocked. "Your brain is rewiring itself," he explains. "The impossible memories are fragments breaking through damaged neural linkages. Complete the puzzle, and those pathways will fully reconnect. Then you'll remember not just what happened, but instructions for what comes next." The vision fades, leaving you with a sense of vast knowledge just out of reach.

### Choices & Effects

**Ask About Instructions**
- Effect: `askedAboutInstructions = true`
- Resources: Knowledge +8
- Tone: Curious about the larger purpose

**Focus on Process**
- Effect: `focusedOnProcess = true`
- Resources: Knowledge +10, Stress +5
- Tone: Questioning the science

**Worry About Risks**
- Effect: `worriedAboutRisks = true`
- Resources: Stress +12
- Tone: Concerned about consequences

---

## Storylet 4: The Choice to Remember

**ID:** `choice_to_remember`  
**Trigger:** Any choice flag from Storylet 3  
**Arc Position:** Resolution/Branch Point

### Description
Standing outside the computer lab, you feel the weight of choice. The symbols on the napkin seem to pulse with meaning just beyond understanding. John's words echo: break the conceptual blocks, solve the puzzle, rebuild the neural linkages. But there's no guarantee what you'll become when those memories fully return. The Terminal 7 screen glows through the window, waiting. This isn't just about remembering the past - it's about accepting instructions for a future you can't yet imagine.

### Choices & Effects

**Solve Puzzle Alone**
- Effect: `memoryApproach = 'independent'`, `startingArcComplete = true`
- Resources: Knowledge +10, Energy +5
- Exit Position: Independent investigation path

**Accept Guidance**
- Effect: `memoryApproach = 'guided'`, `startingArcComplete = true`
- Resources: Social +10, Stress +5
- Exit Position: Mentored development path

**Resist Process**
- Effect: `memoryApproach = 'cautious'`, `startingArcComplete = true`
- Resources: Knowledge +8, Stress +8
- Exit Position: Careful analysis path

---

## Arc Themes & Mysteries

### Central Mysteries
- What are the conceptual blocks and why do they exist?
- What instructions await full memory recovery?
- Who designed the puzzle system and why?
- What happens when neural pathways fully reconnect?

### Investigation Elements
- Symbols on napkin require interpretation
- Clues hidden "where impossible things feel normal"
- Terminal 7 access puzzle must be solved
- Campus locations contain puzzle pieces

### Character Development
- Player learns they have blocked memories
- Introduction to idea of neural reconstruction
- Choice between independence, guidance, or caution
- Sets approach for future memory recovery

### Next Arc Setup
- All paths lead to puzzle investigation
- Terminal 7 becomes central location
- John established as potential mentor figure
- Memory recovery process begins in earnest
