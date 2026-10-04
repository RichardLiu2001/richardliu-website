+++
date = '2026-09-29T12:00:00-04:00'
draft = false
title = 'Makeup'
+++

{{< makeup-layers >}}

## 1. Common Goals

### 1a. Face Regions
Your face can be split up into several commonly targeted regions which correspond to physical structures in your face.

```sql
CREATE TABLE FACE_REGIONS(REGION PK, DESCRIPTION);
```
{{< face-regions >}}

### 1b. BATs
**Beauty Aesthetic Target (BAT)**: a commonly desired visual characteristic of a face that beauty-oriented makeup attempts to create, strengthen, or preserve.
- A BAT is not a product or technique. It is the desired visual endpoint.
- BATs can vary by culture or individual. Below, I'm using commonly accepted BATs.
```sql
CREATE TABLE BATS(BAT PK, DESCRIPTION, FACE_REGIONS[] FK);
```

| BAT | Family | Face regions | Meaning |
|---|---|---|---|
| `EVEN_SKIN_TONE` | `SURFACE_HEALTH` | `[GENERAL_FACE_SKIN]` | Skin coloration appears more uniform |
| `SMOOTH_LOOKING_SKIN` | `SURFACE_HEALTH` | `[GENERAL_FACE_SKIN]` | Skin surface appears smoother / less texturally irregular |
| `HEALTHY_CHEEK_FLUSH` | `SURFACE_HEALTH` | `[CHEEKS]` | Cheeks have a preferred reddish/pink coloration |
| `REDUCED_UNDER_EYE_DARKNESS` | `SURFACE_HEALTH` | `[UNDER_EYES]` | Under-eye region appears less dark/discolored |
| `SUN_KISSED_WARMTH` | `SURFACE_HEALTH` | `[FOREHEAD, CHEEKS, NOSE, JAW]` | Skin appears warmer / lightly tanned, as if from sun exposure |
| `FAIR_BRIGHT_COMPLEXION` | `SURFACE_HEALTH` | `[GENERAL_FACE_SKIN]` | Skin appears lighter and brighter overall |
| `PROMINENT_EYES` | `FEATURE_SALIENCE` | `[EYES_EYELIDS, LASHES]` | Eyes stand out more strongly from the surrounding face |
| `DEFINED_BROWS` | `FEATURE_SALIENCE` | `[BROWS]` | Brows appear clearer and more visually defined |
| `VISIBLE_LASHES` | `FEATURE_SALIENCE` | `[LASHES]` | Eyelashes appear more noticeable |
| `PROMINENT_LIPS` | `FEATURE_SALIENCE` | `[LIPS]` | Lips stand out more strongly from surrounding skin |
| `LARGER_EYES` | `GEOMETRY_PROPORTION` | `[EYES_EYELIDS]` | Eyes appear larger |
| `LIFTED_ELONGATED_EYES` | `GEOMETRY_PROPORTION` | `[EYES_EYELIDS]` | Eyes appear more elongated and/or lifted |
| `FULLER_LIPS` | `GEOMETRY_PROPORTION` | `[LIPS]` | Lips appear fuller/larger |
| `NARROWER_DEFINED_NOSE` | `GEOMETRY_PROPORTION` | `[NOSE]` | Nose appears narrower or more structurally defined |
| `PROMINENT_CHEEKBONES` | `GEOMETRY_PROPORTION` | `[CHEEKS]` | Cheekbone structure appears more prominent |
| `DEFINED_JAW` | `GEOMETRY_PROPORTION` | `[JAW, CHIN]` | Jawline/chin boundary appears more structurally defined |

If you asked someone why they are using a makeup product, the BAT is most likely the deepest answer that can be verbalized. Going deeper than the BAT is less clear and goes into anthropology / evolutionary biology. We do not need to go to the level of "cheek redness is attractive because ancestral humans evolved to detect blood perfusion as a fertility signal". We can just assume BATs like `red cheeks = good` as axiomatic and a terminal node.
- Notice how I explain this. BATS has `FACE_REGIONS` as a FK. Thus I cannot explain BATs before explaining `FACE_REGIONS`. Just like a forward-declaration error in C++ or a DAG traversal.

## 2. Execution
### 2a. Types of Changes
Fundamentally, there are only two things makeup can do to your face. The first is change its appearance, or how it looks WITHOUT changing the physical structure. This is essentially applying some sort of pigment to the surface:
```sql
CREATE TABLE APPEARANCE_CHANGES(APPEARANCE_CHANGE PK, DESCRIPTION);
```
| APPEARANCE_CHANGE | Meaning |
|---|---|
| `COLOR` | Change hue, saturation, or lightness |
| `OPACITY` | Change how much underlying skin/feature is visible |
| `FINISH` | Change matte/glossy/shimmer/dewy appearance |

The second is to change the physical geometry of the face, which is mostly to hair (brows and lashes).

```sql
CREATE TABLE STRUCTURE_CHANGES(STRUCTURE_CHANGE PK, DESCRIPTION);
```
| STRUCTURE_CHANGE | Meaning |
|---|---|
| `LENGTH` | Make hairs/fibers longer |
| `THICKNESS` | Make individual hairs appear/become thicker |
| `DENSITY` | Increase apparent amount of hair |
| `ORIENTATION` | Change direction/curl/position |
| `ADD_MATERIAL` | Add lashes, fibers, etc. |

### 2b. Order
These changes are also typically applied to the face in layers in a specific order.
```sql
CREATE TABLE LAYERS(LAYER PK, DESCRIPTION, TYPICAL_PRIORITY INT);
```
| Layer | Examples | Typical priority |
|---|---|---|
| `PREP` | primer | 1 |
| `COMPLEXION_BASE` | foundation, skin tint, BB/CC cream, tone-up cream | 2 |
| `LOCAL_CORRECTION` | concealer, color corrector | 3 |
| `FACE_DIMENSION_COLOR` | blush, bronzer, contour, highlighter | 4 |
| `FEATURE_MAKEUP` | eyeshadow, eyeliner, mascara, false lashes, brow products, lipstick, lip liner | 5 |
| `FINISH_SET` | setting powder, finishing powder, setting spray, some gloss/topper products | 6 |
- Note that this can also technically vary by the person, but this is pretty much the universal order. Some layers may also be skipped.

### 2c. Tools
There are various tools that are used to apply changes.
```sql
CREATE TABLE TOOLS (
    TOOL PK,
    DESCRIPTION
);
```
| TOOL | DESCRIPTION |
|---|---|
| `BRUSH` | Applies and blends powders, creams, or liquids |
| `SPONGE` | Applies and blends complexion products by pressing/dabbing |
| `POWDER_PUFF` | Presses powder onto the skin |
| `SPOOLIE` | Brushes and arranges brow or lash hairs |
| `EYELASH_CURLER` | Physically curls eyelashes |
| `TWEEZERS` | Grips individual hairs or false lashes |

```sql
CREATE TABLE FORMULATIONS (
    FORMULATION PK,
    DESCRIPTION
);

```
| FORMULATION | DESCRIPTION |
|---|---|
| `POWDER` | Dry particulate makeup, loose or pressed |
| `LIQUID` | Flowing liquid formulation |
| `CREAM` | Thick, spreadable semi-solid/emulsion |
| `GEL` | Gel-like semi-solid formulation |
| `BALM` | Soft waxy/oily semi-solid |
| `WAX` | Firmer wax-based formulation, common in brow/lip products |
| `SOLID` | Solid cosmetic material, e.g. traditional lipstick or pencil core |

## 3. Makeup
so
Now we can define makeup as products that:
- Target one or more BATs (for which there are target `FACE_REGIONS[]`), and
- Are typically applied in one or more LAYERs, and
- Perform the change via modifying appearance and/or physical structure.
```sql
CREATE TABLE MAKEUP (
    PRODUCT PK,
    DESCRIPTION,
    BATS[] FK,
    LAYERS[] FK,
    FORMULATIONS[] FK,
    TOOLS[] FK,
    APPEARANCE_CHANGES[] FK,
    STRUCTURE_CHANGES[] FK,
);
```

Now, we can easily understand and conceptualize each makeup product:
| PRODUCT | DESCRIPTION | BATS[] | LAYERS[] | FORMULATIONS[] | TOOLS[] | APPEARANCE_CHANGES[] | STRUCTURE_CHANGES[] |
|---|---|---|---|---|---|---|---|
| `PRIMER` | Prepares skin for later makeup | `[SMOOTH_LOOKING_SKIN]` | `[PREP]` | `[LIQUID, CREAM, GEL]` | `[BRUSH, SPONGE]` | `[FINISH]` | `[]` |
| `FOUNDATION` | Broadly evens facial skin appearance | `[EVEN_SKIN_TONE, SMOOTH_LOOKING_SKIN]` | `[COMPLEXION_BASE]` | `[LIQUID, CREAM, POWDER, SOLID]` | `[BRUSH, SPONGE, POWDER_PUFF]` | `[COLOR, OPACITY, FINISH]` | `[]` |
| `SKIN_TINT` | Lightweight complexion evening | `[EVEN_SKIN_TONE]` | `[COMPLEXION_BASE]` | `[LIQUID, CREAM]` | `[BRUSH, SPONGE]` | `[COLOR, OPACITY]` | `[]` |
| `TONE_UP_CREAM` | Lightly tinted cream that lightens and brightens overall complexion | `[FAIR_BRIGHT_COMPLEXION]` | `[COMPLEXION_BASE]` | `[CREAM]` | `[BRUSH, SPONGE]` | `[COLOR]` | `[]` |
| `CONCEALER` | Locally hides discoloration or darkness | `[EVEN_SKIN_TONE, REDUCED_UNDER_EYE_DARKNESS]` | `[LOCAL_CORRECTION]` | `[LIQUID, CREAM, SOLID]` | `[BRUSH, SPONGE]` | `[COLOR, OPACITY]` | `[]` |
| `COLOR_CORRECTOR` | Uses compensating color to reduce visible discoloration | `[EVEN_SKIN_TONE, REDUCED_UNDER_EYE_DARKNESS]` | `[LOCAL_CORRECTION]` | `[LIQUID, CREAM, SOLID]` | `[BRUSH, SPONGE]` | `[COLOR, OPACITY]` | `[]` |
| `BLUSH` | Adds reddish/pink coloration to cheeks | `[HEALTHY_CHEEK_FLUSH]` | `[FACE_DIMENSION_COLOR]` | `[POWDER, CREAM, LIQUID, SOLID]` | `[BRUSH, SPONGE]` | `[COLOR]` | `[]` |
| `BRONZER` | Adds warmer/darker coloration to selected facial regions | `[SUN_KISSED_WARMTH]` | `[FACE_DIMENSION_COLOR]` | `[POWDER, CREAM, LIQUID, SOLID]` | `[BRUSH, SPONGE]` | `[COLOR]` | `[]` |
| `CONTOUR` | Adds strategic darkness to alter apparent facial geometry | `[PROMINENT_CHEEKBONES, NARROWER_DEFINED_NOSE, DEFINED_JAW]` | `[FACE_DIMENSION_COLOR]` | `[POWDER, CREAM, LIQUID, SOLID]` | `[BRUSH, SPONGE]` | `[COLOR]` | `[]` |
| `HIGHLIGHTER` | Adds brightness and/or reflectivity to selected regions | `[PROMINENT_CHEEKBONES, PROMINENT_EYES]` | `[FACE_DIMENSION_COLOR]` | `[POWDER, CREAM, LIQUID, SOLID]` | `[BRUSH, SPONGE]` | `[COLOR, FINISH]` | `[]` |
| `EYESHADOW` | Changes coloration around the eyes | `[PROMINENT_EYES, LARGER_EYES, LIFTED_ELONGATED_EYES]` | `[FEATURE_MAKEUP]` | `[POWDER, CREAM, LIQUID, SOLID]` | `[BRUSH]` | `[COLOR, OPACITY, FINISH]` | `[]` |
| `EYELINER` | Adds a defined line around the eye | `[PROMINENT_EYES, LARGER_EYES, LIFTED_ELONGATED_EYES]` | `[FEATURE_MAKEUP]` | `[LIQUID, GEL, SOLID]` | `[BRUSH]` | `[COLOR, OPACITY]` | `[]` |
| `MASCARA` | Darkens and alters eyelashes | `[VISIBLE_LASHES, PROMINENT_EYES]` | `[FEATURE_MAKEUP]` | `[LIQUID, GEL, WAX]` | `[SPOOLIE, EYELASH_CURLER]` | `[COLOR]` | `[THICKNESS, LENGTH, ORIENTATION]` |
| `FALSE_LASHES` | Adds artificial lash material | `[VISIBLE_LASHES, PROMINENT_EYES, LARGER_EYES]` | `[FEATURE_MAKEUP]` | `[]` | `[TWEEZERS, EYELASH_CURLER]` | `[]` | `[ADD_MATERIAL, LENGTH, DENSITY]` |
| `BROW_PENCIL` | Adds color/definition to brows | `[DEFINED_BROWS]` | `[FEATURE_MAKEUP]` | `[SOLID, WAX]` | `[SPOOLIE]` | `[COLOR, OPACITY]` | `[]` |
| `BROW_GEL` | Colors and/or holds brow hairs in position | `[DEFINED_BROWS]` | `[FEATURE_MAKEUP]` | `[GEL, WAX]` | `[SPOOLIE]` | `[COLOR]` | `[ORIENTATION]` |
| `LIPSTICK` | Changes lip coloration and prominence | `[PROMINENT_LIPS]` | `[FEATURE_MAKEUP]` | `[SOLID, LIQUID, CREAM, BALM]` | `[BRUSH]` | `[COLOR, OPACITY, FINISH]` | `[]` |
| `LIP_LINER` | Defines or extends the visible lip boundary | `[PROMINENT_LIPS, FULLER_LIPS]` | `[FEATURE_MAKEUP]` | `[SOLID, WAX]` | `[]` | `[COLOR, OPACITY]` | `[]` |
| `LIP_GLOSS` | Adds a glossy/reflective lip finish | `[PROMINENT_LIPS, FULLER_LIPS]` | `[FEATURE_MAKEUP, FINISH_SET]` | `[LIQUID, GEL]` | `[BRUSH]` | `[FINISH]` | `[]` |
| `SETTING_POWDER` | Reduces shine and helps set complexion products | `[SMOOTH_LOOKING_SKIN]` | `[FINISH_SET]` | `[POWDER]` | `[BRUSH, POWDER_PUFF]` | `[FINISH, OPACITY]` | `[]` |
| `SETTING_SPRAY` | Alters final finish and helps makeup persist | `[]` | `[FINISH_SET]` | `[LIQUID]` | `[]` | `[FINISH]` | `[]` |

{{< makeup-product-map >}}

### The Noetic Point
