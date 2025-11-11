// /src/editor/MapEditor.ts
import { provinceColorMap } from '../provinceData.js';
const COUNTRY_DETECTION_RULES = [
    { keywords: ['Alaska', 'Sitka', 'Juneau', 'Ketchikan', 'Kenai', 'Unalaska', 'Anchorage', 'Fairbanks'], country: 'USA' },
    { keywords: ['Whitehorse', 'Dawson City', 'Vancouver', 'Vancouver Island', 'Prince Rupert', 'McLeod Lake', 'Atlin', 'Dawson Creek', 'Prince George', 'Calgary', 'Edmonton', 'Toronto', 'Montreal', 'Ottawa', 'Quebec', 'Winnipeg', 'Regina', 'Halifax', 'Victoria', 'Yellowknife'], country: 'CAN' },
    { keywords: ['Mexico City', 'Guadalajara', 'Monterrey', 'Tijuana', 'Cancun', 'Acapulco', 'Puebla', 'Merida'], country: 'MEX' },
    { keywords: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Edinburgh', 'Glasgow', 'Cardiff', 'Belfast', 'Leeds', 'Bristol'], country: 'GBR' },
    { keywords: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux', 'Lille'], country: 'FRA' },
    { keywords: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Dusseldorf', 'Dortmund', 'Dresden', 'Leipzig'], country: 'DEU' },
    { keywords: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice', 'Bologna', 'Genoa', 'Palermo'], country: 'ITA' },
    { keywords: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Malaga', 'Zaragoza'], country: 'ESP' },
    { keywords: ['Moscow', 'St Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Vladivostok', 'Omsk', 'Chelyabinsk'], country: 'RUS' },
    { keywords: ['Warsaw', 'Krakow', 'Lodz', 'Wroclaw', 'Poznan', 'Gdansk'], country: 'POL' },
    { keywords: ['Kiev', 'Kharkiv', 'Odessa', 'Dnipro', 'Lviv'], country: 'UKR' },
    { keywords: ['Amsterdam', 'Rotterdam', 'Utrecht', 'The Hague', 'Eindhoven'], country: 'NLD' },
    { keywords: ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liege'], country: 'BEL' },
    { keywords: ['Stockholm', 'Gothenburg', 'Malmo', 'Uppsala'], country: 'SWE' },
    { keywords: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'], country: 'NOR' },
    { keywords: ['Copenhagen', 'Aarhus', 'Odense'], country: 'DNK' },
    { keywords: ['Helsinki', 'Espoo', 'Tampere', 'Turku'], country: 'FIN' },
    { keywords: ['Athens', 'Thessaloniki', 'Patras'], country: 'GRC' },
    { keywords: ['Lisbon', 'Porto', 'Braga', 'Coimbra'], country: 'PRT' },
    { keywords: ['Vienna', 'Graz', 'Linz', 'Salzburg'], country: 'AUT' },
    { keywords: ['Prague', 'Brno', 'Ostrava'], country: 'CZE' },
    { keywords: ['Budapest', 'Debrecen', 'Szeged'], country: 'HUN' },
    { keywords: ['Bucharest', 'Cluj', 'Timisoara'], country: 'ROU' },
    { keywords: ['Sofia', 'Plovdiv', 'Varna'], country: 'BGR' },
    { keywords: ['Istanbul', 'Ankara', 'Izmir', 'Antalya'], country: 'TUR' },
    { keywords: ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Sapporo', 'Fukuoka', 'Hiroshima', 'Yokohama'], country: 'JPN' },
    { keywords: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Wuhan', 'Xian', 'Chongqing', 'Tianjin', 'Nanjing', 'Hangzhou'], country: 'CHN' },
    { keywords: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'], country: 'KOR' },
    { keywords: ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad'], country: 'IND' },
    { keywords: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya'], country: 'THA' },
    { keywords: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Bali'], country: 'IDN' },
    { keywords: ['Manila', 'Quezon City', 'Davao', 'Cebu'], country: 'PHL' },
    { keywords: ['Hanoi', 'Ho Chi Minh', 'Da Nang', 'Haiphong'], country: 'VNM' },
    { keywords: ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Malacca', 'Kuala Kelantan', 'San Khew Jong', 'Liwa'], country: 'MYS' },
    { keywords: ['Singapore'], country: 'SGP' },
    { keywords: ['Yangon', 'Mandalay', 'Naypyidaw'], country: 'MMR' },
    { keywords: ['Dhaka', 'Chittagong', 'Khulna'], country: 'BGD' },
    { keywords: ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad'], country: 'PAK' },
    { keywords: ['Tehran', 'Isfahan', 'Shiraz', 'Tabriz'], country: 'IRN' },
    { keywords: ['Baghdad', 'Basra', 'Mosul', 'Erbil'], country: 'IRQ' },
    { keywords: ['Riyadh', 'Jeddah', 'Mecca', 'Medina'], country: 'SAU' },
    { keywords: ['Dubai', 'Abu Dhabi', 'Sharjah'], country: 'ARE' },
    { keywords: ['Tel Aviv', 'Jerusalem', 'Haifa'], country: 'ISR' },
    { keywords: ['Cairo', 'Alexandria', 'Giza', 'Luxor'], country: 'EGY' },
    { keywords: ['Lagos', 'Abuja', 'Kano', 'Ibadan'], country: 'NGA' },
    { keywords: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'], country: 'ZAF' },
    { keywords: ['Nairobi', 'Mombasa', 'Kisumu'], country: 'KEN' },
    { keywords: ['Addis Ababa', 'Dire Dawa'], country: 'ETH' },
    { keywords: ['Kinshasa', 'Lubumbashi', 'Goma'], country: 'COD' },
    { keywords: ['Algiers', 'Oran', 'Constantine'], country: 'DZA' },
    { keywords: ['Casablanca', 'Rabat', 'Marrakech', 'Fes'], country: 'MAR' },
    { keywords: ['Tunis', 'Sfax', 'Sousse'], country: 'TUN' },
    { keywords: ['Tripoli', 'Benghazi', 'Misrata'], country: 'LBY' },
    { keywords: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia', 'Salvador', 'Fortaleza', 'Belo Horizonte'], country: 'BRA' },
    { keywords: ['Buenos Aires', 'Cordoba', 'Rosario', 'Mendoza'], country: 'ARG' },
    { keywords: ['Lima', 'Arequipa', 'Cusco', 'Trujillo'], country: 'PER' },
    { keywords: ['Bogota', 'Medellin', 'Cali', 'Barranquilla'], country: 'COL' },
    { keywords: ['Santiago', 'Valparaiso', 'Concepcion'], country: 'CHL' },
    { keywords: ['Caracas', 'Maracaibo', 'Valencia'], country: 'VEN' },
    { keywords: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Darwin'], country: 'AUS' },
    { keywords: ['Auckland', 'Wellington', 'Christchurch'], country: 'NZL' },
];
export class MapEditor {
    provinceOwnerMap;
    getProvinceAt;
    currentPaintCountry = null;
    constructor(provinceOwnerMap, getProvinceAt) {
        this.provinceOwnerMap = provinceOwnerMap;
        this.getProvinceAt = getProvinceAt;
    }
    setPaintCountry(countryId) {
        this.currentPaintCountry = countryId;
    }
    paintProvince(x, y, isRightClick) {
        const paintId = isRightClick ? null : this.currentPaintCountry;
        const province = this.getProvinceAt(x, y);
        if (province && province.id !== 'OCEAN') {
            const currentOwner = this.provinceOwnerMap.get(province.id);
            const newOwner = paintId;
            if (currentOwner !== newOwner) {
                if (newOwner === null) {
                    this.provinceOwnerMap.delete(province.id);
                }
                else {
                    this.provinceOwnerMap.set(province.id, newOwner);
                }
                return true;
            }
        }
        return false;
    }
    async importAndAutoAssignCSV(csvPath = './definition.csv') {
        try {
            const response = await fetch(csvPath);
            if (!response.ok)
                throw new Error(`Failed to load ${csvPath}`);
            const text = await response.text();
            const lines = text.split('\n');
            let assigned = 0;
            let unassigned = 0;
            const unassignedProvinces = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line)
                    continue;
                const parts = line.split(';');
                if (parts.length < 5)
                    continue;
                const provinceId = parts[0].trim();
                const red = parseInt(parts[1]);
                const green = parseInt(parts[2]);
                const blue = parseInt(parts[3]);
                const provinceName = parts[4].trim();
                const colorKey = `${red},${green},${blue}`;
                const province = provinceColorMap.get(colorKey);
                if (province && province.id !== 'OCEAN') {
                    const detectedCountry = this.detectCountryFromName(provinceName);
                    if (detectedCountry) {
                        this.provinceOwnerMap.set(province.id, detectedCountry);
                        assigned++;
                    }
                    else {
                        unassigned++;
                        unassignedProvinces.push(`${province.id}: ${provinceName}`);
                    }
                }
            }
            console.log(`Auto-Assignment Results:`);
            console.log(`✅ Assigned: ${assigned} provinces`);
            console.log(`❌ Unassigned: ${unassigned} provinces`);
            if (unassignedProvinces.length > 0 && unassignedProvinces.length <= 20) {
                console.log(`Unassigned provinces:`, unassignedProvinces);
            }
            return { assigned, unassigned, unassignedList: unassignedProvinces };
        }
        catch (error) {
            console.error('CSV Import failed:', error);
            throw error;
        }
    }
    detectCountryFromName(provinceName) {
        const normalizedName = provinceName.toLowerCase().trim();
        for (const rule of COUNTRY_DETECTION_RULES) {
            for (const keyword of rule.keywords) {
                if (normalizedName.includes(keyword.toLowerCase())) {
                    return rule.country;
                }
            }
        }
        return null;
    }
    exportMapData() {
        console.log("Generating map data for export...");
        let fileContent = `
// This file is auto-generated by the in-game map editor.
// Copy this content and paste it into 'src/provinceAssignments.ts'

export const provinceToCountryMap = new Map<string, string>([
`;
        const sortedEntries = [...this.provinceOwnerMap.entries()].sort((a, b) => {
            return parseInt(a[0]) - parseInt(b[0]);
        });
        for (const [provinceId, countryId] of sortedEntries) {
            fileContent += `    ["${provinceId}", "${countryId}"],\n`;
        }
        fileContent += ']);\n';
        console.log("Export data generated.");
        return fileContent;
    }
    getCurrentPaintCountry() {
        return this.currentPaintCountry;
    }
}
//# sourceMappingURL=MapEditor.js.map