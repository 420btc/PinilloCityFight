export interface Fighter {
  id: string
  name: string
  description: string
  portrait: string
  sprite: string
  punchSprite?: string
  kickSprite?: string
  duckSprite?: string
  jumpSprite?: string
  jumpKickSprite?: string
  defenceSprite?: string
  walkSprite?: string
  lostSprite?: string
  wonSprite?: string
  hitSprite?: string
  useSingleSprite?: boolean
  specialMove: string
}

export const fighters: Fighter[] = [
  {
    id: "Carlos-Freire",
    name: "Carlos Freire",
    description: "The man drone with drone attack!",
    portrait: "/images/fighters/portrait-theschorsch.png",
    sprite: "/images/fighters/thegeorg_stand.png",
    punchSprite: "/images/fighters/thegeorg_punch.png",
    kickSprite: "/images/fighters/thegeorg_kick.png",
    duckSprite: "/images/fighters/thegeorg_duck.png",
    jumpSprite: "/images/fighters/thegeorg_jump.png",
    defenceSprite: "/images/fighters/thegeorg_defence.png",
    walkSprite: "/images/fighters/thegeorg_walk.png",
    lostSprite: "/images/fighters/thegeorg_lost.png",
    wonSprite: "/images/fighters/thegeorg_won.png",
    hitSprite: "/images/fighters/thegeorg_gotpunched.png",
    useSingleSprite: true,
    specialMove: "Roll 360",
  },
  {
    id: "Eric-Quesada",
    name: "Eric Quesada",
    description: "The cool photographist with a sharp mind",
    portrait: "/images/fighters/portrait-daveradau.png",
    sprite: "/images/fighters/dave-radau-stand.png",
    punchSprite: "/images/fighters/dave-radau-punch.png",
    kickSprite: "/images/fighters/daveradau_kick.png",
    duckSprite: "/images/fighters/daveradau_duck.png",
    jumpSprite: "/images/fighters/daveradau_jump.png",
    defenceSprite: "/images/fighters/daveradau_defence.png",
    walkSprite: "/images/fighters/daveradau_walk.png",
    lostSprite: "/images/fighters/dave-radau-lost.png",
    wonSprite: "/images/fighters/dave-radau-won.png",
    hitSprite: "/images/fighters/daveradau_gotpunched.png",
    useSingleSprite: true,
    specialMove: "Rafage photo attack",
  },
  {
    id: "David-Cabeza",
    name: "David Cabeza",
    description: "The man of weed and a love for nature",
    portrait: "/images/fighters/portrait-jensator.png",
    sprite: "/images/fighters/jensator-stand.png",
    punchSprite: "/images/fighters/jensator-punch.png",
    kickSprite: "/images/fighters/jensator-kick.png",
    duckSprite: "/images/fighters/jensator-duck.png",
    jumpSprite: "/images/fighters/jensator-jump.png",
    defenceSprite: "/images/fighters/jensator_defence.png",
    walkSprite: "/images/fighters/jensator_walk.png",
    lostSprite: "/images/fighters/jensator-lost.png",
    wonSprite: "/images/fighters/jensator-won.png",
    hitSprite: "/images/fighters/jensator_gotpunched.png",
    useSingleSprite: true,
    specialMove: "Weed Crusher",
  },
  {
    id: "Jorge-Freitas",
    name: "Jorge Freitas",
    description: "The mysterious 420 detective with unpredictable moves",
    portrait: "/images/fighters/portrait-justusjonas.png",
    sprite: "/images/fighters/justusjonas_stand.png",
    punchSprite: "/images/fighters/justusjonas_punch.png",
    kickSprite: "/images/fighters/justusjonas_kick.png",
    duckSprite: "/images/fighters/justusjonas_duck.png",
    jumpSprite: "/images/fighters/justusjonas_jump.png",
    defenceSprite: "/images/fighters/justusjonas_defence.png",
    walkSprite: "/images/fighters/justusjonas_walk.png",
    lostSprite: "/images/fighters/justusjonas_lost.png",
    wonSprite: "/images/fighters/justusjonas_won.png",
    hitSprite: "/images/fighters/justusjonas_gotpunched.png",
    useSingleSprite: true,
    specialMove: "Three Joints Attack",
  },
  {
    id: "Melissa",
    name: "Melissa",
    description: "The super girl with a strong punch",
    portrait: "/images/fighters/portrait-paddy.png",
    sprite: "/images/fighters/paddy_stand.png",
    punchSprite: "/images/fighters/paddy_punch.png",
    kickSprite: "/images/fighters/paddy_kick.png",
    duckSprite: "/images/fighters/paddy_duck.png",
    jumpSprite: "/images/fighters/paddy_jump.png",
    defenceSprite: "/images/fighters/paddy_defence.png",
    walkSprite: "/images/fighters/paddy_walk.png",
    lostSprite: "/images/fighters/paddy_lost.png",
    wonSprite: "/images/fighters/paddy_won.png",
    hitSprite: "/images/fighters/paddy_gotpunched.png",
    useSingleSprite: true,
    specialMove: "Mel's Punch Attack",
  },
  {
    id: "Carlos-gil",
    name: "Carlos Gil",
    description: "The steel-willed fighter with unbreakable defense",
    portrait: "/images/fighters/portrait-nicorohstahl.png",
    sprite: "/images/fighters/nicorohstahl_stand.png",
    punchSprite: "/images/fighters/nicorohstahl_punch.png",
    kickSprite: "/images/fighters/nicorohstahl_kick.png",
    duckSprite: "/images/fighters/nicorohstahl_duck.png",
    jumpSprite: "/images/fighters/nicorohstahl_jump.png",
    defenceSprite: "/images/fighters/nicorohstahl_defence.png",
    walkSprite: "/images/fighters/nicorohstahl_walk.png",
    lostSprite: "/images/fighters/nicorohstahl_lost.png",
    wonSprite: "/images/fighters/nicorohstahl_won.png",
    hitSprite: "/images/fighters/nicorohstahl_gotpunched.png",
    useSingleSprite: true,
    specialMove: "Cave man attack",
  },
]
