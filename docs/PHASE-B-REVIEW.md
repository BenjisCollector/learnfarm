# Phase B review: what testers saw, and what comes next

Two simulated testers used the 3D viewer without being told what had changed:

- **Sara**, desktop, English, has never farmed.
- **Abdullah**, iPhone, Arabic first, thinking about a small farm in Al-Wafra, plus a strict layout QA pass.

They were asked to report problems plainly, not to be kind. Below is what they found, what is already fixed, and the improvement plan ranked by how much each item blocks learning.

## Fixed in this phase

| Problem the testers hit | Fix |
|---|---|
| Moving dots were tiny specks, impossible to follow | Dots are larger beads with a short trail and an outline. Tap an area and only its own flows stay on the map, drawn as tubes |
| Dashed lines everywhere cluttered the farm | No lines by default. Lines appear only for the area you tapped |
| Map labels overlapped each other and covered the buildings | Labels became small badges: a pixel icon and the name (icon only on phones). Size shows only for the tapped area. Badges push apart when they collide |
| Pixel look was low resolution | The diorama renders at the screen's own resolution with soft toon shading, soft shadows and outlines |
| Milk legend swatch was white on white | Every resource, crop and animal has a block-style pixel icon (hen, cow, goat, tomato, corn, lettuce, water, feed, manure, compost, eggs, milk) used on the map, in the legend, the area list and the cards |
| Shortage label kept saying "40,000 L" while the tank was empty | Troubled badges show the warning, not the capacity |
| Manure arrows in the System diagram were a tangle | Return arrows run in their own lanes under every box and rise into the compost heap |
| Tap targets under 40 px | Rotate, play and speed buttons are 40 px or larger |
| Tour button easy to miss | It now reads "Confused? Click here" / "محتار؟ اضغط هنا". The language button shows the Kuwait or UK flag |

## Improvement plan

Ranked by how much each item blocks a beginner from understanding the loop.

1. **Show the chain, not just the ending (high).** At 30x the pump-off test jumps straight to "everything died". Pause automatically at the first shortage and at the first death, with a one-line "why" on the map ("Tank empty, so the cows have no water"). Move the "What happened" log up, or show its latest line under the time bar.
2. **One animal at a time (high).** The Animals card stacks hens, cows and goats, so "what do hens need?" has to be dug out. Tapping a species badge on the map should open just that species.
3. **System diagram on phones (high).** The Market box is cut off and the text is about 8 px. Lay the diagram out vertically on narrow screens (supplies, stores, parts, market from top to bottom) so it fits 375 px with readable text.
4. **Plain words (medium).** Replace "dry matter" and "35% → Compost" with "about a third of the manure's weight becomes compost". Explain "your setting" the first time it appears.
5. **Arabic consistency (medium).** One digit and separator style everywhere (٤٠٬٠٠٠, ٢٫٧, ٪). Plants "wither" (ذبلت), animals "die" (نفقت). Fix "نفقت دجاج بيّاض" and "كم تصمد دون". Keep Latin names like Hy-Line isolated so they don't break right-to-left text.
6. **Gentler pump-off lesson (medium).** Start the scenario with a prompt ("Switch the well pump off and press play") instead of leaving the switch as a bare checkbox.
7. **House row has no figure (low).** Say what the house is for (people, not production) so the empty size doesn't look like missing data.
8. **Crops that look stressed (low).** Wilted, browner plants during a water shortage, before they die, so the map shows the problem without reading a badge.

Items 1 to 3 belong in Phase C (learning path) planning because they change how a lesson is paced. Items 4 to 8 are small and can land any time.
