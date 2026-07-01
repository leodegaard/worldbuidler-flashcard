export type SeedCard = {
  id: string;
  category: string;
  prompt: string;
};

export const seedCards: SeedCard[] = [
  // npc
  { id: "npc-1", category: "npc", prompt: "Who is a merchant in this world who deals in something illegal, and why do people look the other way?" },
  { id: "npc-2", category: "npc", prompt: "Describe an NPC who used to be adventurer-famous and now lives quietly. What changed?" },
  { id: "npc-3", category: "npc", prompt: "Who is someone in a position of minor power who abuses it in a small, believable way?" },
  { id: "npc-4", category: "npc", prompt: "Name an NPC the party will meet who is lying to them about something small and harmless." },
  { id: "npc-5", category: "npc", prompt: "Who is the most respected person in a town, and what do they actually think about at night?" },

  // location
  { id: "location-1", category: "location", prompt: "What's a location in this world that looks peaceful but everyone quietly avoids at night?" },
  { id: "location-2", category: "location", prompt: "Describe a place that used to serve one purpose and now serves a completely different one." },
  { id: "location-3", category: "location", prompt: "What's a landmark that every local knows the name of, but no outsider understands the significance of?" },
  { id: "location-4", category: "location", prompt: "Where do two very different groups of people cross paths without normally wanting to?" },
  { id: "location-5", category: "location", prompt: "What's a smell, sound, or sight that instantly identifies a specific place in this world?" },

  // faction
  { id: "faction-1", category: "faction", prompt: "What does this faction want that it can't say out loud?" },
  { id: "faction-2", category: "faction", prompt: "Which two factions publicly cooperate but privately can't stand each other, and why?" },
  { id: "faction-3", category: "faction", prompt: "What does a faction believe about itself that isn't actually true?" },
  { id: "faction-4", category: "faction", prompt: "How does a faction recruit new members, and what do they leave out of the pitch?" },

  // history
  { id: "history-1", category: "history", prompt: "What historical event does almost everyone misremember, and what actually happened?" },
  { id: "history-2", category: "history", prompt: "What was destroyed generations ago that people still build their lives around the absence of?" },
  { id: "history-3", category: "history", prompt: "Who is a historical figure that one group reveres and another reviles?" },
  { id: "history-4", category: "history", prompt: "What treaty, deal, or agreement is still technically in effect but nobody quite honors anymore?" },

  // conflict
  { id: "conflict-1", category: "conflict", prompt: "What's a conflict brewing that no one in power wants to name yet?" },
  { id: "conflict-2", category: "conflict", prompt: "What resource is quietly running out, and who's noticed first?" },
  { id: "conflict-3", category: "conflict", prompt: "Who would benefit if a current peace fell apart?" },
  { id: "conflict-4", category: "conflict", prompt: "What small, personal grudge could escalate into something much bigger?" },

  // culture
  { id: "culture-1", category: "culture", prompt: "What's a mundane daily custom in this world that would confuse an outsider?" },
  { id: "culture-2", category: "culture", prompt: "How do people in this world mark the passage from childhood to adulthood?" },
  { id: "culture-3", category: "culture", prompt: "What's considered rude here that wouldn't be rude anywhere else?" },
  { id: "culture-4", category: "culture", prompt: "What do people in this world do when someone dies? What's left unsaid at a funeral?" },
];
