// /src/game/GameStateInitializer.ts
import { countryData } from '../countryData.js';
import { provinceToCountryMap } from '../provinceAssignments.js';
const gameData = {
    "countries": [
        {
            "id": "USA",
            "name": "United States of America",
            "code": "USA",
            "position": { "x": 200, "y": 200 },
            "territories": [],
            "color": "#0066cc",
            "gdp": 10250.0,
            "gdpPerCapita": 36300,
            "population": 282.2,
            "unemploymentRate": 3.9,
            "inflationRate": 3.4,
            "nationalDebt": 5674.0,
            "interestRate": 6.5,
            "resources": {
                "oil": 3000, "steel": 5000, "aluminum": 2000, "rubber": 500, "rareEarths": 800,
                "semiconductors": 1500, "uranium": 300, "coal": 8000, "food": 10000, "energy": 4000
            },
            "militaryStrength": 100,
            "militarySpending": 294.4,
            "politicalPower": 150,
            "politicalPowerGain": 2.5,
            "stability": 85,
            "warSupport": 70,
            "government": "federal_republic",
            "ideology": "liberal_democracy",
            "relations": { "CHN": -10, "RUS": -25 },
            "alliances": ["NATO"],
            "corruptionLevel": 15,
            "economicGrowthRate": 4.1
        },
        {
            "id": "CHN",
            "name": "People's Republic of China",
            "code": "CHN",
            "position": { "x": 600, "y": 250 },
            "territories": [],
            "color": "#cc0000",
            "gdp": 1211.3,
            "gdpPerCapita": 959,
            "population": 1262.6,
            "unemploymentRate": 3.1,
            "inflationRate": 0.4,
            "nationalDebt": 150.0,
            "interestRate": 5.8,
            "resources": {
                "oil": 1200, "steel": 8000, "aluminum": 3000, "rubber": 300, "rareEarths": 5000,
                "semiconductors": 800, "uranium": 200, "coal": 15000, "food": 8000, "energy": 2500
            },
            "militaryStrength": 75,
            "militarySpending": 14.6,
            "politicalPower": 200,
            "politicalPowerGain": 3.0,
            "stability": 75,
            "warSupport": 60,
            "government": "totalitarian",
            "ideology": "communism",
            "relations": { "USA": -10, "RUS": 15 },
            "alliances": [],
            "corruptionLevel": 35,
            "economicGrowthRate": 8.4
        },
        {
            "id": "RUS",
            "name": "Russian Federation",
            "code": "RUS",
            "position": { "x": 500, "y": 150 },
            "territories": [],
            "color": "#006600",
            "gdp": 259.7,
            "gdpPerCapita": 1775,
            "population": 146.4,
            "unemploymentRate": 10.6,
            "inflationRate": 20.8,
            "nationalDebt": 62.9,
            "interestRate": 25.0,
            "resources": {
                "oil": 8000, "steel": 4000, "aluminum": 1500, "rubber": 100, "rareEarths": 2000,
                "semiconductors": 200, "uranium": 800, "coal": 6000, "food": 3000, "energy": 3500
            },
            "militaryStrength": 85,
            "militarySpending": 9.2,
            "politicalPower": 180,
            "politicalPowerGain": 2.2,
            "stability": 65,
            "warSupport": 55,
            "government": "authoritarian",
            "ideology": "nationalism",
            "relations": { "USA": -25, "CHN": 15 },
            "alliances": ["CSTO"],
            "corruptionLevel": 45,
            "economicGrowthRate": 6.4
        },
        {
            "id": "GBR",
            "name": "United Kingdom",
            "code": "GBR",
            "position": { "x": 400, "y": 180 },
            "territories": [],
            "color": "#0099ff",
            "gdp": 1659.0,
            "gdpPerCapita": 28100,
            "population": 59.0,
            "unemploymentRate": 5.4,
            "inflationRate": 0.8,
            "nationalDebt": 540.0,
            "interestRate": 6.0,
            "resources": { "oil": 2500, "steel": 1000, "aluminum": 500, "semiconductors": 800, "coal": 2000, "food": 2000, "energy": 1500 },
            "militaryStrength": 65,
            "militarySpending": 38.4,
            "politicalPower": 160,
            "politicalPowerGain": 2.3,
            "stability": 80,
            "warSupport": 45,
            "government": "constitutional_monarchy",
            "ideology": "liberal_democracy",
            "relations": { "USA": 25, "FRA": 15, "DEU": 20 },
            "alliances": ["NATO"],
            "corruptionLevel": 20,
            "economicGrowthRate": 3.9
        },
        {
            "id": "FRA",
            "name": "France",
            "code": "FRA",
            "position": { "x": 420, "y": 220 },
            "territories": [],
            "color": "#0000ff",
            "gdp": 1362.0,
            "gdpPerCapita": 22800,
            "population": 59.8,
            "unemploymentRate": 9.1,
            "inflationRate": 1.8,
            "nationalDebt": 567.0,
            "interestRate": 5.4,
            "resources": { "oil": 500, "steel": 1200, "uranium": 300, "coal": 1000, "food": 3000, "energy": 1200 },
            "militaryStrength": 60,
            "militarySpending": 29.5,
            "politicalPower": 155,
            "politicalPowerGain": 2.1,
            "stability": 75,
            "warSupport": 40,
            "government": "democracy",
            "ideology": "social_democracy",
            "relations": { "GBR": 15, "DEU": 25, "USA": 20 },
            "alliances": ["NATO"],
            "corruptionLevel": 25,
            "economicGrowthRate": 3.4
        },
        {
            "id": "DEU",
            "name": "Germany",
            "code": "DEU",
            "position": { "x": 450, "y": 200 },
            "territories": [],
            "color": "#333333",
            "gdp": 1952.0,
            "gdpPerCapita": 23700,
            "population": 82.3,
            "unemploymentRate": 7.9,
            "inflationRate": 1.4,
            "nationalDebt": 1211.0,
            "interestRate": 5.3,
            "resources": { "oil": 200, "steel": 2000, "semiconductors": 1000, "coal": 3000, "food": 2500, "energy": 1800 },
            "militaryStrength": 50,
            "militarySpending": 24.3,
            "politicalPower": 140,
            "politicalPowerGain": 2.0,
            "stability": 85,
            "warSupport": 35,
            "government": "federal_republic",
            "ideology": "liberal_democracy",
            "relations": { "FRA": 25, "GBR": 20, "USA": 25 },
            "alliances": ["NATO"],
            "corruptionLevel": 18,
            "economicGrowthRate": 3.2
        },
        {
            "id": "JPN",
            "name": "Japan",
            "code": "JPN",
            "position": { "x": 700, "y": 240 },
            "territories": [],
            "color": "#ff6666",
            "gdp": 4968.0,
            "gdpPerCapita": 39300,
            "population": 126.7,
            "unemploymentRate": 4.7,
            "inflationRate": -0.7,
            "nationalDebt": 4887.0,
            "interestRate": 0.5,
            "resources": { "oil": 100, "steel": 1500, "semiconductors": 2000, "coal": 500, "food": 1000, "energy": 1200 },
            "militaryStrength": 55,
            "militarySpending": 45.8,
            "politicalPower": 120,
            "politicalPowerGain": 1.8,
            "stability": 90,
            "warSupport": 25,
            "government": "constitutional_monarchy",
            "ideology": "liberal_democracy",
            "relations": { "USA": 30, "CHN": -5, "RUS": -15 },
            "alliances": [],
            "corruptionLevel": 12,
            "economicGrowthRate": 2.9
        }
    ],
    "alliances": [
        {
            "id": "NATO",
            "name": "North Atlantic Treaty Organization",
            "leaderCountryId": "USA",
            "memberCountryIds": ["USA", "GBR", "FRA", "DEU"],
            "type": "military",
            "foundedDate": { "year": 1949, "month": 4, "day": 4, "hour": 0 }
        },
        {
            "id": "CSTO",
            "name": "Collective Security Treaty Organization",
            "leaderCountryId": "RUS",
            "memberCountryIds": ["RUS"],
            "type": "military",
            "foundedDate": { "year": 1992, "month": 5, "day": 15, "hour": 0 }
        }
    ]
};
export class GameStateInitializer {
    static initializeGameState() {
        const countries = new Map();
        const alliances = new Map();
        // Create basic entries for all countries
        for (const [id, data] of countryData.entries()) {
            const basicCountry = {
                id: id,
                name: data.name,
                code: id,
                position: { x: 0, y: 0 },
                territories: [],
                color: data.color,
                gdp: 0,
                gdpPerCapita: 0,
                population: 0,
                unemploymentRate: 0,
                inflationRate: 0,
                nationalDebt: 0,
                interestRate: 0,
                resources: {
                    oil: 0,
                    steel: 0,
                    aluminum: 0,
                    rubber: 0,
                    rareEarths: 0,
                    semiconductors: 0,
                    uranium: 0,
                    coal: 0,
                    food: 0,
                    energy: 0
                },
                militaryStrength: 10,
                militarySpending: 0,
                politicalPower: 50,
                politicalPowerGain: 0.2,
                stability: 50,
                warSupport: 50,
                government: "democracy",
                ideology: "liberal_democracy",
                relations: new Map(),
                alliances: [],
                corruptionLevel: 20,
                economicGrowthRate: 1
            };
            countries.set(id, basicCountry);
        }
        // Override with detailed data for major countries
        for (const majorCountryData of gameData.countries) {
            const country = countries.get(majorCountryData.id);
            if (!country) {
                console.warn(`Country ${majorCountryData.id} exists in gameData but not in countryData master list!`);
                continue;
            }
            Object.assign(country, {
                ...majorCountryData,
                relations: new Map(Object.entries(majorCountryData.relations || {})),
                government: majorCountryData.government,
                ideology: majorCountryData.ideology,
                resources: majorCountryData.resources
            });
        }
        // Populate territories
        for (const [provinceId, countryId] of provinceToCountryMap.entries()) {
            const country = countries.get(countryId);
            if (country) {
                country.territories.push(provinceId);
            }
        }
        console.log(`Populated territories for ${countries.size} countries.`);
        // Load alliances
        for (const allianceData of gameData.alliances) {
            alliances.set(allianceData.id, allianceData);
        }
        return {
            currentDate: { year: 2000, month: 1, day: 1, hour: 0 },
            isPaused: true,
            gameSpeed: 1,
            countries,
            alliances,
            selectedCountryId: null
        };
    }
}
//# sourceMappingURL=GameStateInitializer.js.map