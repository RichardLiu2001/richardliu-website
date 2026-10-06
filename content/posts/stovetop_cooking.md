+++
date = '2026-10-04T12:00:00-04:00'
draft = false
title = 'Stovetop Cooking'
+++
{{< stovetop-hero >}}
_"Preheat the pan to medium-high heat."_ Cook until brown, until shimmering, etc. (insert other cooking phrases).

What the fuck does that actually mean? In my experience, these type of instructions are just vague enough to give a decent chance of your steak being Oppenheimer-level nuked on the outside while still mooing on the inside, having the texture of a high-quality rubber glove, or setting off your fire alarm until you figure out how to rip the batteries out.

This is also why advice like heating it until water droplet skids across the pan is kind of bullshit.
## 1. Empty Pan
### 1a. Stove Settings
You turn the stove on and a fire appears. But what's actually the difference between the low, medium and high settings?

The setting controls the amount of power going to the flame. This basically just makes the fire bigger, but not hotter. The fire is always the same temperature.
- We can confirm this with the observation that the fire is always the same color. If the stove setting controlled the fire's temperature, then the flame on low would be red, medium yellow, and high blue. But that's not the case - the fire is always blue (~3600 degrees F).
- Thus the key insight is **the stove setting changes power, not temperature**.
### 1b. Putting the Pan on the Stove
Now let's put an empty pan on the stove. What happens?

The pan heats up, but it doesn't reach 3600 degrees (it would actually melt if it did). This is because heat is also being lost to things in the environemnt. Let's define:

**Equilibrium Temperature (of a pan, given a fixed stove setting)**: the asymptotic temperature that a pan will reach.
- In other words, the temperature the pan would eventually approach if you just put it on the stove, left it there, and walked away.
- Defined as the temperature when `heat in == heat out`.
- **Higher stove heat settings have higher equilibrium temperatures**.

Moreover, the temperature of the pan jumps up quickly at first, and then slowly climbs up towards the equilibrium temperature.

{{< fig title="Pan temperature at Low, Medium and High"
    caption="The first 10 minutes at each burner setting, with the dashed equilibrium line each one approaches."
    how="Hover or tap to read all three temperatures at a moment." >}}
{{< stovetop-curves >}}
{{< /fig >}}

Key observations:
1. A higher setting means a higher equilibrium temperature
2. All settings follow exponential-ish curves: grows fast at the beginning, slows down when approaching equilibrium temperature
3. A higher setting also makes the curve steeper at the beginning.

Below, you can try different stove settings and press play to see the temperature increase over time. You can also change the stove setting while the pan is already heating up.

{{< fig title="Heating an empty pan" kind="interactive"
    caption="Burner → pan → room: the pan heats until heat in equals heat out."
    how="Pick a burner setting and press **Play**. Change the setting mid-run to see the curve bend toward a new equilibrium." >}}
{{< stovetop-heating >}}
{{< /fig >}}

## 2. Applying it to Food
### 2a. Food and its Layers
When you put food in the pan, several things happen simultaneously:
1. The temperature of the pan drops, then starts climbing again
2. The temperature of the food's surface jumps
3. The temperature of the food's interior rises, but not as abruptly as the surface's temperature because heat takes time to travel to the center.

{{< fig title="Food does not have one temperature"
    caption="Heat moves from the hot pan into the surface, then inward toward the center." >}}
{{< stovetop-food-lesson >}}
{{< /fig >}}

{{< fig title="Cold food in a hot pan" kind="interactive"
    caption="Burner → pan → food surface → food center."
    how="Press **Play**, then **Add food**. **Reset** starts over." >}}
{{< stovetop-food >}}
{{< /fig >}}

### 2b. You Need the BBL
The goal of stovetop cooking is to achieve two separate objectives simultaneously:
1. Get browning / crust on the surface of the food (which tastes good due to the Maillard reaction).
    - No browning has no flavor, excessive browning becomes burnt.
2. Make the food's internal temperature fall within a desired range.
    - Below the range is raw, above the range is rubbery and/or dry.

{{< fig title="Browning depends on temperature and time"
    caption="Hold a surface at one temperature and its browning builds up: hotter surfaces get there, and burn, sooner." >}}
{{< stovetop-browning-regions >}}
{{< /fig >}}

Hence, we can call this dual objective the Browning and Body-temperature Landing (BBL).

{{< fig title="The surface and center are on different clocks" kind="interactive"
    caption="Can the surface brown and the center reach its target at the same time?"
    how="Press **Play**, then **Add food**, and watch the browning and doneness strips under the graph." >}}
{{< stovetop-outcome >}}
{{< /fig >}}

### 2c. Additional Factors
There are three main additional factors that affect the outcome of the food
1. Thickness: the thicker the food is, the longer it takes for the heat to reach the center. The result is increasing thickness will "stretch" out the center temperature curve horizontally, making it look flatter and hence take more time to reach the target temperature.
2. Initial temperature of the meat: mostly changes the initial starting point of both the center and surface curves. A higher initial temperature will obviously cause all curves to reach the target temperatures faster.
3. Flip: typically you want both sides of the food to be browned.
- Secondary effect also heat travels through the food to the center one way. We've been using a simplified model, heat is actually a gradient. But in practice, you will normally flip, to achieve browning on both sides, and as a result, heat the other side as well. We can abstract temperature gradient away and use center temperature as our proxy for doneness.

{{< fig title="What changes the center-temperature curve?"
    caption="Two properties of the food itself: not techniques, but the problem you're cooking." >}}
{{< stovetop-variables >}}
{{< /fig >}}

{{< fig title="Thickness, starting temperature, flipping and carryover" kind="interactive"
    caption="The same simulator, now with two sides and the controls you actually have."
    how="Pick a thickness and starting temperature, press **Play** and **Add food**, then **Flip** and **Remove food** as it cooks." >}}
{{< stovetop-outcome-extended >}}
{{< /fig >}}

{{< fig title="Find a cooking strategy" kind="interactive"
    caption="Put it all together. The food sets the problem; you choose the controls; the model says whether both sides and the center land on target together."
    how="Set the problem and the controls, or press **Find a valid strategy**." >}}
{{< stovetop-strategy >}}
{{< /fig >}}

The type of food (chicken, fish, beef) can affect how fast heat travels to the center (they have different protein/fat/water compositions) but this matters much much less than the thickness. The main difference is the target doneness temperature.

Common scenarios
- Pan too cold:
- Pan too hot:

And we can also derive techniques
- Make the meat thinner
- 

### The Noetic Point
As a excessive DoorDash user, none of this content is  particularly relevant or useful to me. Even when I do cook, I prefer to air fry 
I don't even really like cooking, especially not on the stove. 
It's really just a series of exponential curves with asymptotes. Then adding food applies constant and predictable changes to the curves. Finally, you just need to get the food curves within the target ranges.