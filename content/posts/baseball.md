+++
date = '2026-09-26T18:49:33-04:00'
draft = false
title = 'Baseball I: Game Flow'
+++
Have you ever watched baseball, looked at the scoreboard, and asked yourself "what the fuck is this bullshit?" Why are there so many numbers?

{{< fig title="Baseball scoreboards"
    caption="Two real scoreboards. Every number on them is part of the game state this post builds up." >}}
![scoreboard](https://preview.redd.it/what-does-the-stuff-in-the-scoreboard-mean-v0-vujgcs8j7lrc1.jpeg?auto=webp&s=d701ec7c4416a200c3a207cfa169746a6b5a4a9d)
![scoreboard](https://keepthescore.com/static/images/blog_images/baseball-scoreboard-detailed.jpg)
{{< /fig >}}

The reason why baseball seems complicated is . Today I will explain.

## 1. Baseball is a Triply-Nested State Machine
The game structure of baseball is really just three nested state machines:
| - GAME 
  --- HALF_INNING
    --- PLATE_APPEARANCE
where the conclusion of one state machine ripples upwards and updates the state of the parent state machine.

### 1a. The Game State Machine
Let's define:
**Half-Inning**: A period where one team is on offense and the other is on defense. The offense tries to score as many runs (points) as possible before the half-inning is concluded. (Will explain how it concludes later).
**Inning**: A pair of sequential half-innings where each team is offense/defense.
- The AWAY team is on offense during the first half-inning of inning N is called "Top of the Nth", e.g Top of the Third.
- The HOME team is on offense during the second half-inning, which is called "Bottom of the Nth".

A typical game of baseball is made up of 9 innings, with the 18th half-inning (bottom of the 9th) skipped if the home team leads at the conclusion of the 17th (top of the 9th). 
- Extra innings (overtime): if the score is tied after 9 full innings, we just continue playing full innings until one team leads at the conclusion of the full inning.

```python
def baseball():
    home_team_runs, away_team_runs = 0, 0
    for inning in range(1, 10):
        away_team_runs += half_inning(batting_team="AWAY")
        if inning == 9 and home_team_runs > away_team_runs:
            return "HOME_TEAM_WINS" # bottom 9th skipped if home team already leads.
        home_team_runs += half_inning(batting_team="HOME")
    while home_team_runs == away_team_runs: # extra innings
        away_team_runs += half_inning(batting_team="AWAY")
        home_team_runs += half_inning(batting_team="HOME")
    return "HOME_TEAM_WINS" if home_team_runs > away_team_runs else "AWAY_TEAM_WINS"
```

{{< fig title="The game state machine" >}}
{{< baseball-level level="game" >}}
{{< /fig >}}

### 1b. The Half-Inning State Machine
Let's define:
**Plate appearance**: an offensive player's turn to try to hit the ball thrown by the pitcher. Will describe what ends a plate appearance later.
**Out**: the defense successfully retiring (killing) an offensive player. (Will explain how outs are obtained in 1c).
A half-inning is simply an infinite sequence of plate appearances until three outs are reached.

```python
def half_inning(batting_team):
    outs, runs = 0, 0
    while outs < 3:
        outs_recorded, runs_scored = baserunning(plate_appearance()) # see Baseball II
        outs += outs_recorded
        runs += runs_scored
    return runs
```

{{< fig title="The half-inning state machine" >}}
{{< baseball-level level="half" >}}
{{< /fig >}}

### 1c. The Plate Appearance State Machine
Let's define:

**Pitch**: the action of the pitcher throwing the ball to the batter.

**Strike**: a pitch that is ruled as an advantage to the pitcher

**Ball (Pitch outcome)**: a pitch that is ruled as an advantage to the batter. Not to be confused with the physical baseball.

**Batted Ball**: a pitch that made contact with the batter's bat
 - **Fair ball**: in play, i.e lands between the white lines. Can result in an out or no out.
 - **Foul ball**: out of play

**Hit**: fair ball and the batter is not out (mechanism to be described in baseball II). Here we're going to call errors the same as hits, functionally.
**Strikeout**: 3 strikes are reached. Results in the batter being retired. Foul balls count as +1 strike unless there are 2 strikes.
**Base on Balls (Walk)**: 4 balls are reached. Results in the batter advancing.
**Hit By Pitch**: pitch hits the batter's body. Results in the batter advancing.

{{< fig title="The plate-appearance state machine" >}}
{{< baseball-level level="pa" >}}
{{< /fig >}}

### The State Machine

{{< fig title="The whole game, as nested state machines" kind="interactive"
    caption="The three machines above, nested: each box with a blue border contains its own state machine."
    how="Click a box with a blue border to expand it, or press **Expand all**." >}}
{{< baseball-statechart >}}
{{< /fig >}}

{{< fig title="Two scoreboards, one game state" kind="animation"
    caption="The TV score bug and the field scoreboard show the same state, laid out differently."
    how="It plays when you scroll to it. **Pause** or **Replay** at any time." >}}
{{< scoreboard-sync >}}
{{< /fig >}}

### Try It

{{< fig title="The game-state odometer" kind="interactive"
    caption="Each wheel rolls over into the next, like an odometer: count → outs → half inning → inning → game over."
    how="Add balls, strikes, outs and runs. **New game** resets." >}}
{{< count-simulator >}}
{{< /fig >}}

### Code
```python
"""
Can end with HIT, WALK, OUT, HIT_BY_PITCH
Ignore special circumstances like batter gets injured, drop third strike, catcher's interference, half inning ends in the middle of the plate appearance (runner caught stealing for third out, walkoff past ball)
Ignore ball tipped into catcher's glove, pitch clock violation,
Ignore ABS challenge
"""
def plate_appearance():
    balls, strikes = 0, 0
    while balls < 4 and strikes < 3:
        pitch_outcome = throw_pitch()
        if pitch_outcome.is_batted: # batter's bat touched the ball
            if pitch_outcome.is_in_play:
                return "OUT" if pitch_outcome.is_out else "HIT" # Consider an error as a hit, they are functionally equivalent
            else: # foul ball
                if pitch_outcome.caught_in_air: # only foul balls caught in the air are considered outs
                    return "OUT"
                else:
                    strikes = min(2, strikes + 1) # a foul ball counts as +1 strikes unless you are already at 2 strikes.
        else: # batter either didn't swing or swung and missed
            if pitch_outcome.is_ball:
                balls += 1
            elif pitch_outcome.is_strike:
                strikes += 1
            else: # batter hit by pitch
                return "HIT_BY_PITCH"

    if balls == 4:
        return "WALK"
    return "OUT" # three strikes is a strikeout

"""
Plays plate appearances until 3 outs, and returns the runs scored.
Each plate appearance can produce 0-3 outs (e.g. double play) and 0-4 runs. Which ones depends on the runners on base, which is covered in Baseball II.
"""
def half_inning(batting_team):
    outs, runs = 0, 0
    while outs < 3:
        outs_recorded, runs_scored = baserunning(plate_appearance()) # see Baseball II
        outs += outs_recorded
        runs += runs_scored
    return runs

def baseball():
    home_team_runs, away_team_runs = 0, 0
    for inning in range(1, 10):
        away_team_runs += half_inning(batting_team="AWAY")
        if inning == 9 and home_team_runs > away_team_runs:
            return "HOME_TEAM_WINS" # second half-inning of the 9th inning is skipped if the home team leads already.
        home_team_runs += half_inning(batting_team="HOME")
    while home_team_runs == away_team_runs: # extra innings (overtime)
        away_team_runs += half_inning(batting_team="AWAY")
        home_team_runs += half_inning(batting_team="HOME")
    return "HOME_TEAM_WINS" if home_team_runs > away_team_runs else "AWAY_TEAM_WINS"
```

Noetic approach to baseball.
