+++
date = '2026-09-26T18:49:33-04:00'
draft = true
title = 'Baseball I: Game Flow'
+++
Have you ever watched baseball, looked at the scoreboard, and asked yourself "what the fuck is this bullshit?"
![scoreboard](https://preview.redd.it/what-does-the-stuff-in-the-scoreboard-mean-v0-vujgcs8j7lrc1.jpeg?auto=webp&s=d701ec7c4416a200c3a207cfa169746a6b5a4a9d)
![scoreboard](https://keepthescore.com/static/images/blog_images/baseball-scoreboard-detailed.jpg)

{{< scoreboard-sync >}}

### The State Machine
{{< baseball-statechart >}}

### Try It
{{< count-simulator >}}

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
