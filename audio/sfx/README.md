# Sound effects

| File | When it plays |
|---|---|
| `Click_sound.mp3` | Any button, and placing a building or wall |
| `Building_built.mp3` | A building finishes, an upgrade finishes, a repair finishes (softer) |
| `Building_sold.mp3` | You demolish a building |
| `Building_destroyed.mp3` | Raiders destroy a building; a raider siege engine is broken |
| `Coins_payout.mp3` | Every 20 s payout |
| `Arrow_shot.mp3` | Any archer shoots (yours or the raiders') |
| `Enemy_attack_1.mp3`, `Enemy_attack_2.mp3` | A raider strikes a building; one of the two at random, never the same twice running |
| `Attack_clash.mp3` | A soldier and a raider trade blows (either side striking) |
| `Arrow_hit.mp3` | A raider falls, when the grunt has played in the last 3 s |
| `Enemy_grunt_1.mp3`, `Enemy_grunt_2.mp3` | A raider falls (at most once every 3 s); one of the two at random, never the same twice running |
| `Market_trade.mp3` | A trade at the market |
| `Morning_rooster.mp3` | Dawn, when a night is won |
| `Villager_yawn.mp3` | A hungry villager goes to sleep (at most once every 3 s) |
| `Not_allowed.mp3` | A tap or key that can't be done (any red hint right after it: "Occupied", "Need 5 wood", "Night only"…) |
| `Woodcutter_axe.mp3` | One chop per axe swing (single strikes are cut out of the recording automatically) |
| `Mason_pick.mp3` | One hit per pick swing (cut the same way) |
| `Farmer_hoe.mp3` | One stroke per hoe swing |
| `Builder_hammer.mp3` | One knock per hammer swing (cut the same way) |
| `Path_placed.mp3` (not supplied yet) | A path tile is laid; until it exists a soft hoe stroke plays instead |
| `Bird_chirping.mp3` | Loops softly during the day, stops at night |
| `Ballista_bolt_shot.mp3` | A ballista looses its bolt (yours or the raiders') |
| `Crossbow_quiver_shot.mp3` | A crossbow shoots (your crossbowmen or the raiders') |
| `Rock_fired.mp3` | A catapult, mangonel or trebuchet lets its stone go (yours or the raiders') |
| `Rock_hit_ground.mp3` | The stone lands |
| `Fire_sound.mp3` | Loops near torches and campfires: louder the closer the camera looks and the further it zooms in |
| `River_water_flow.mp3` | Loops near rivers the same way |
| `Battleram_hit.mp3` | A battering ram's log strikes a wall, gate or building |
| `Alert_sound.mp3` | Each new-building card as it pops up at the start of a stage |
| `Chicken_cluck.mp3`, `Pig_oink.mp3`, `Cow_moo.mp3` | Now and then from a farmhouse yard (only the animals it keeps), when the camera is close in on it |
| `Horse_neigh.mp3` | Now and then from the stables, when the camera is close in on them |
| `Horse_gallop.mp3` | Loops while horses (mounted raiders, your riders) are on the move near where the camera looks; loud only zoomed in |

**Volume balance:** every clip is measured when it loads (loudness of its loudest 0.3 s) and brought to one
common level, then trimmed by how prominent it should be, like medieval-td. So re-uploading a file at a
different recording level needs no code change. World sounds also get quieter the further they are from
where the camera looks. To add or rename a sound, edit the `SND` table in `index.html`.

`Bird_chirping.m4a`, `Fire_sound.m4a`, `River_water_flow.m4a` and `Horse_gallop.m4a` are compressed copies of their `.mp3` for faster phone loading; if you replace an `.mp3`, delete its `.m4a` too (or remake it: `ffmpeg -i x.mp3 -c:a aac -b:a 96k x.m4a`).

Leading silence in a clip is skipped automatically when it loads, so a sound lands right on its event.
