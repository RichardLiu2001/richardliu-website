+++
date = '2026-09-26T18:49:03-04:00'
draft = false
title = 'Clothing Fabrics'
+++
{{< fig title="From cotton plant to shirt" kind="animation"
    caption="Plant → fibers → yarn → woven fabric → shirt."
    how="It plays when you scroll to it. Click a step to jump to it, or use **Pause** and **Replay**." >}}
{{< cotton-to-shirt >}}
{{< /fig >}}
Do you prefer silk or satin? 

The correct response is actually, "that question is bullshit."

I was shopping for clothes the other day and read a bunch of terms such as cotton, linen, chino, tweed, twill, suede, khaki, silk, denim, wool, polyester, nylon, oxford, jersey, piqué, corduroy, velvet, satin, rayon, chenille, felt, flannel, hemp, cashmere, henley, latex, and percale. Naturally, I was extremely fucking confused.

Why is such a ubiquitious topic like clothing fabrics so confusing? Because there is no Noetic model. I will establish one below.

## How is Clothing Made?
First we need to understand how clothes are made. There are three steps:
1. **Create sheets**: obtain or manufacture 2D planes of material.
2. **Apply finishes**: post-process the sheets to change their appearance, feel, and/or performance.
3. **Assemble garment**: cut, combine, and/or assemble those sheets into human-shaped clothes.

### 1. Creating Sheets

#### 1a. Fibers to Yarns
First, we need to define a **fiber** as a tiny strand of material, like a hair. Consider this as the smallest, atomic unit that a fabric can be made of. To formalize this and enumerate some examples, let's:
```sql
CREATE TABLE FIBERS(Fiber PK, Origin, Form)
```
| Fiber | Origin | Form |
|---|---|---|
| Cotton | Natural (cotton plant) | Staple (short hairs) |
| Flax | Natural (flax plant) | Staple |
| Wool | Natural (sheep hairs) | Staple |
| Silk | Natural (silkworms) | Filament (long hairs) |
| Polyester | Synthetic (man-made) | Staple or filament |
| Nylon | Synthetic | Staple or filament |
- The point of the `CREATE TABLE` syntax to formalize the general idea of establishing a class (table) of entity, with every instance (row) sharing the same set of characteristics (columns).
- Here, `FIBER` is the class of entity (fibers), with cotton, flax, etc. being instances of that class (each is an example of a fiber). Every instance has an `Origin` and `Form`, though their values may be different.

{{< fig title="Fibers up close"
    caption="Flax, cotton, silk, wool and rayon fibers, magnified. Image: Ulster Linen." >}}
![fibers](https://ulsterlinen.com/wp-content/uploads/2018/05/Fibres-Longitudinal.jpg)
{{< /fig >}}

Now, let's define a **yarn** as a bunch of fibers combined into a long and thicker continuous strand. There are various ways of doing this.
```sql
CREATE TABLE YARN_CONSTRUCTIONS(Yarn Construction PK, Description)
```
| Yarn Construction | Description |
|---|---|
| **Spun** | Overlap and twist short fibers together into a continuous strand |
| **Filament** | Combine one or more continuous fibers into a strand |
| **Plied** | Twist two or more existing yarns together |
| **Chenille** | Trap short fibers between core strands so they stick out from the sides |
| **Bouclé** | Combine yarns so that loops or curls form along the strand |

Note that many yarns themselves are simply named after the construction method, e.g Spun yarn, Chenille yarn, etc. We can just imagine a table 
```sql
CREATE TABLE YARNS(Yarn PK, Description)
```
that is identical to `YARN_CONSTRUCTIONS`, with the Yarn name equal to "Yarn" added after the construction name.

{{< fig title="Yarns"
    caption="Image: Wikimedia Commons." >}}
![yarns](https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Yarn_at_Folklife_-_Stierch.jpg/1280px-Yarn_at_Folklife_-_Stierch.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=thumbnail)
{{< /fig >}}

#### 1b. Yarns to Sheets
Now that we have yarn, we can turn yarn into a sheet by interlacing yarns together. There are two main ways to interlace yarn into a sheet:
- **Knit**: loop yarn through itself. Within knitting, there are a few different structures.
```sql
CREATE TABLE KNIT_PATTERNS(Knit Pattern PK, Description)
```
| Knit Pattern | Description |
|---|---|
| **Jersey** | Basic knit with a smooth front and slightly different-looking back |
| **Rib** | Raised vertical lines; very stretchy across the width |
| **Interlock** | Two knit layers joined together; thicker, smoother, and more stable |
| **Piqué** | Small raised texture, often seen in polo shirts |
| **Cable** | Knit loops are crossed to create rope-like raised patterns |
| **French terry** | Smooth front with small loops on the back |
- **Weave**: interlace two perpendicular sets of yarns. Within weaves, there are three main ways to interlace the two sets of yarn, basically based on the over/under pattern. 
```sql
CREATE TABLE WEAVE_PATTERNS(Weave Pattern PK, Description)
```
| Weave Pattern | Description |
|---|---|
| **Plain** | Yarns alternate over and under each other |
| **Twill** | The over-under pattern shifts each row, creating diagonal lines |
| **Satin** | Yarns pass over several yarns before going under one |

{{< fig title="Plain, twill and satin weaves, and a jersey knit" kind="animation"
    how="It plays when you scroll to it. Press **Replay** to watch again." >}}
{{< weave-diagrams >}}
{{< /fig >}}

#### 1c. Nonwoven Sheet Methods
We can also directly turn fibers into sheets without turning it into yarn and knitting/weaving it together.

```sql
CREATE TABLE NONWOVEN_METHODS(Nonwoven Method PK, Description)
```
For now there's only one notable row:
| Nonwoven Method | Description |
|---|---|
| **Felting** | Fibers are pressed and tangled together |

#### 1d. Sheet Materials
1a - 1c covered was one big pipeline from fibers to sheets. However, sheets do not always need to be created from fibers. Sheets can also be created directly from materials that already exist as sheets, or by manufacturing a material directly into sheet form. 
```sql
CREATE TABLE SHEET_MATERIALS(Sheet Material PK, Description)
```
| Sheet Material | Description |
|---|---|
| **Leather** | Animal skin processed into a durable sheet |
| **Suede** | Leather with a soft, fuzzy surface |
| **Rubber** | Flexible elastic material formed into sheets |
| **Latex** | Rubber-like material that can be formed into thin flexible sheets |
| **Vinyl / PVC** | Synthetic plastic sheet material |

That gives us this diagram on how we get a sheet for step 1:

{{< fig title="From fiber to sheet" >}}
{{< fabric-paths mode="sheet" >}}
{{< /fig >}}

- Square-cornered boxes are material states (physical structures), while rounded boxes are transformation methods (how we transition from one physical structure to the next).
- Sheets that are made from fibers are typically called "fabrics".

### 2. Applying Finishes
After we have the sheet, we can optionally apply one or more finishes to it. This is post-processing an already made sheet. A finish is a process, i.e *something you do* to the sheet. There are several broad families of finishes:
- Coloration: change the color
- Mechanical surface: physically change the surface texture
- Washing: Process the sheet in a bath to soften, fade, abrade, or give it a worn-in state
- Chemical treatment: Apply chemistry that changes how the fabric behaves
- Coating: Add another material layer on top

Now we can 
```sql
CREATE TABLE FINISHES(Finish PK, Families[], Description, Effects)
```
| Finish | Families | Description | Effects |
|---|---|---|---|
| **Dyeing** | Coloration | Changes the textile’s overall color | Color |
| **Printing** | Coloration | Applies color selectively in patterns or images | Pattern / graphics |
| **Napping** | Mechanical surface | Raises fibers from the surface | Soft, fuzzy, warmer |
| **Sueding** | Mechanical surface | Lightly abrades the surface | Soft, peach/suede-like feel |
| **Stone Washing** | Washing | Wears or softens the textile through abrasion or enzymes | Softer, faded, worn-in |
| **Water-repellent treatment** | Chemical treatment | Alters surface chemistry so water resists soaking in | Water repellency |
| **Mercerization** | Chemical treatment | Chemically treats cotton under tension | More luster, strength, dye uptake |
| **PU coating** | Coating | Applies a polyurethane layer to the fabric | Barrier, water resistance, added structure |

### Surface Texture
The surface texture is a separate dimension that describes the physical outer texture of the sheet. A surface texture can result from either the underlying construction of the sheet itself, or a finish applied later on. So surface texture is a physical characteristic of a sheet, while finish is a process that you apply to a sheet that may or may not affect the surface.

First, let's define **pile** as material sticking up from the main surface of the fabric.
```sql
CREATE TABLE SURFACE_TEXTURES(Surface PK, Description)
```
| Surface Texture | Description |
|---|---|
| **Flat** | The surface is mostly even and smooth |
| **Textured** | The surface has bumps or an uneven feel |
| **Napped** | Tiny fibers stick out and make it feel fuzzy |
| **Loop pile** | Small loops of yarn stick up from the surface |
| **Cut pile** | Short cut fibers stick up from the surface |
| **Ribbed** | Raised lines or ridges run along the surface |

### 3. Assembling Garments
A garment is the shape/design of the finished clothing item. This can be independent of the fabric. 
```sql
CREATE TABLE GARMENTS(Garment PK, Description)
```
| Garment | Description |
|---|---|
| **Polo** | Shirt with a soft collar and short buttoned opening at the neck |
| **Henley** | Collarless shirt with a short buttoned opening at the neck |
| **Jeans** | Pants traditionally made from denim |
| **Chinos** | Casual pants traditionally made from chino cloth |
| **Sweater** | Knitted upper-body garment |

## Final Result
Now we have everything we need to understand the remaining terms, which are common, named combinations of values in the other tables.
```sql
CREATE TABLE NAMED_FABRICS(
    Named Fabric PK,
    Fibers[] FK NULLABLE,
    Yarn Constructions[] FK NULLABLE,
    Knit Pattern FK NULLABLE,
    Weave Pattern FK NULLABLE,
    Nonwoven Process FK NULLABLE,
    Finishes[] FK NULLABLE,
    Surfaces[] FK NULLABLE
)
```
| Named Fabric | Fibers[] | Yarn Constructions[] | Knit Pattern | Weave Pattern | Nonwoven Process | Finishes[] | Surfaces[] |
|---|---|---|---|---|---|---|---|
| **Denim** | Cotton | Spun | — | Twill | — | Dyeing | Flat |
| **Chino cloth** | Cotton | Spun | — | Twill | — | — | Flat |
| **Tweed** | Wool | Spun | — | Plain, Twill | — | — | Textured |
| **Oxford cloth** | Cotton | Spun | — | Plain | — | — | Textured |
| **Corduroy** | Cotton | Spun | — | — | — | Napping | Cut pile,  Ribbed |
| **Velvet** | Silk, Cotton, Rayon, Polyester | Spun, Filament | — | — | — | Napping | Cut pile |
| **Flannel** | Cotton, Wool | Spun | — | Plain, Twill | — | Napping | Napped |
| **Felt** | Wool, Polyester | — | — | — | Felting | — | Napped |
| **Percale** | Cotton | Spun | — | Plain | — | — | Flat |
| **Linen** | Flax | Spun | — | Plain | — | — | Flat, Textured |

#### Each Named Fabric Is a Path

{{< fig title="Every path from fiber to fabric" kind="interactive"
    caption="Each named fabric is one path through the chart."
    how="Pick a fabric to highlight its path." >}}
{{< fabric-paths >}}
{{< /fig >}}

And we can now correctly categorize every single term from earlier:
| Term | Table it belongs in |
|---|---|
| **Linen** | NAMED_FABRICS |
| **Chino Fabric** | NAMED_FABRICS |
| **Chino** | GARMENTS |
| **Khaki** | COLORS (table omitted) |
| **Tweed** | NAMED_FABRICS |
| **Silk** | FIBERS |
| **Denim** | NAMED_FABRICS |
| **Wool** | FIBERS |
| **Polyester** | FIBERS |
| **Nylon** | FIBERS |
| **Oxford** | NAMED_FABRICS |
| **Jersey** | KNIT_PATTERNS |
| **Piqué** | KNIT_PATTERNS |
| **Cotton** | FIBERS |
| **Corduroy** | NAMED_FABRICS |
| **Velvet** | NAMED_FABRICS |
| **Satin** | WEAVE_PATTERNS |
| **Rayon** | FIBERS |
| **Chenille** | YARNS |
| **Felt** | NAMED_FABRICS |
| **Flannel** | NAMED_FABRICS |
| **Hemp** | FIBERS |
| **Leather** | SHEET_MATERIALS |
| **Suede** | SHEET_MATERIALS |
| **Cashmere** | FIBERS |
| **Henley** | GARMENTS |
| **Latex** | SHEET_MATERIALS |
| **Percale** | NAMED_FABRICS |

## The Noetic Point
I don't really give a fuck about fabrics. The point is that it's a good example of a topic that can be easily compressed into a couple of models. Then, the dozens of fabrics and names and shit can basically just be reduced to another row in one of the tables. You just need to create the right ontology consisting of:
1. The flowchart of how garments are produced
    - Recognize and distinguish between physical structures and transformation methods
2. The different classes of entities, where each class of entity typically corresponds to a node in the flowchart from #1.
    - Each class has a table, and each row in each table is just another instance of that class. Cotton, wool, etc. are instances of `FIBERS`. Plain, twill, and satin are instances of `WEAVE_PATTERNS`. But it is important to understand that `FIBERS` and `WEAVE_PATTERNS` are not the same class of thing, and this is made obvious by the fact that they are different tables.
    - As a result, the original question asking about one's preference between silk and satin can be easily identified as nonsense. Silk and satin are not in the same table and hence are not the same class of thing that can be compared. Satin is a way of interweaving two sets of yarn, while silk is a string that comes out of a silkworm's ass. Satin sits downstream of silk in the flowchart, and as the model predicts, a satin fabric can be made of polyester, nylon, and in fact, silk. Asking if you prefer silk or satin is like asking if you prefer chicken or frying - a bullshit question indeed!
3. "Named fabrics" as unique paths through the flowchart.