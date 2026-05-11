export interface NeighborhoodGroup {
  label: string
  neighborhoods: string[]
}

export const NEIGHBORHOOD_GROUPS: NeighborhoodGroup[] = [
  {
    label: "Downtown",
    neighborhoods: [
      "Battery Park City",
      "Chinatown",
      "Civic Center",
      "Financial District",
      "Fulton / Seaport",
      "Hudson Square",
      "Little Italy",
      "Lower East Side",
      "Nolita",
      "SoHo",
      "Tribeca",
    ],
  },
  {
    label: "Village",
    neighborhoods: ["East Village", "Greenwich Village", "West Village"],
  },
  {
    label: "Chelsea / Flatiron",
    neighborhoods: [
      "Chelsea",
      "Flatiron",
      "Gramercy Park",
      "NoMad",
      "West Chelsea",
    ],
  },
  {
    label: "Midtown West",
    neighborhoods: [
      "Central Park South",
      "Hell's Kitchen",
      "Hudson Yards",
      "Midtown",
      "Midtown South",
      "Midtown West",
    ],
  },
  {
    label: "Midtown East",
    neighborhoods: [
      "Beekman",
      "Kips Bay",
      "Midtown East",
      "Murray Hill",
      "Sutton Place",
      "Turtle Bay",
    ],
  },
  {
    label: "Upper East Side",
    neighborhoods: [
      "Carnegie Hill",
      "Lenox Hill",
      "Upper Carnegie Hill",
      "Upper East Side",
      "Yorkville",
    ],
  },
  {
    label: "Upper West Side",
    neighborhoods: ["Lincoln Square", "Manhattan Valley", "Upper West Side"],
  },
  {
    label: "Harlem & North",
    neighborhoods: [
      "Central Harlem",
      "East Harlem",
      "Fort George",
      "Hamilton Heights",
      "Hudson Heights",
      "Inwood",
      "Manhattanville",
      "Marble Hill",
      "Morningside Heights",
      "South Harlem",
      "Washington Heights",
    ],
  },
]

export const ALL_NEIGHBORHOODS: string[] = NEIGHBORHOOD_GROUPS.flatMap(
  (g) => g.neighborhoods
)
