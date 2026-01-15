// Данни за марки и модели автомобили
const carBrands = {
  'Audi': [
    'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
    'Q2', 'Q3', 'Q5', 'Q7', 'Q8',
    'TT', 'R8', 'e-tron', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7'
  ],
  'BMW': [
    '1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series',
    'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7',
    'Z4', 'i3', 'i4', 'i7', 'iX', 'iX3',
    'M2', 'M3', 'M4', 'M5', 'M8'
  ],
  'Mercedes-Benz': [
    'A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class',
    'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class',
    'AMG GT', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS',
    'Maybach', 'V-Class', 'Vito', 'Sprinter'
  ],
  'Volkswagen': [
    'Polo', 'Golf', 'Jetta', 'Passat', 'Arteon', 'CC',
    'T-Cross', 'T-Roc', 'Tiguan', 'Touareg',
    'Touran', 'Sharan', 'Caddy', 'Transporter', 'Multivan',
    'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID.Buzz',
    'Up!', 'Beetle', 'Scirocco'
  ],
  'Toyota': [
    'Yaris', 'Corolla', 'Camry', 'Avalon', 'Crown',
    'C-HR', 'RAV4', 'Highlander', 'Land Cruiser', '4Runner',
    'Prius', 'Mirai', 'bZ4X',
    'Supra', 'GR86', 'Hilux', 'Tacoma', 'Tundra',
    'Sienna', 'Proace'
  ],
  'Honda': [
    'Jazz', 'Civic', 'Accord', 'Insight',
    'HR-V', 'CR-V', 'Pilot', 'Passport',
    'e', 'e:Ny1', 'ZR-V',
    'NSX', 'S2000', 'Odyssey', 'Ridgeline'
  ],
  'Ford': [
    'Fiesta', 'Focus', 'Mondeo', 'Fusion', 'Taurus',
    'Puma', 'EcoSport', 'Kuga', 'Edge', 'Explorer', 'Expedition',
    'Mustang', 'Mustang Mach-E', 'GT',
    'Ranger', 'F-150', 'Bronco',
    'Transit', 'Transit Connect', 'Tourneo'
  ],
  'Opel': [
    'Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland',
    'Zafira', 'Combo', 'Vivaro', 'Movano',
    'Adam', 'Karl', 'Meriva', 'Cascada'
  ],
  'Peugeot': [
    '108', '208', '308', '408', '508',
    '2008', '3008', '5008',
    'e-208', 'e-308', 'e-2008', 'e-3008',
    'Partner', 'Rifter', 'Expert', 'Boxer', 'Traveller'
  ],
  'Renault': [
    'Clio', 'Megane', 'Talisman', 'Captur', 'Kadjar', 'Koleos', 'Austral',
    'Scenic', 'Espace', 'Kangoo', 'Trafic', 'Master',
    'Zoe', 'Megane E-Tech', 'Twingo', 'Arkana'
  ],
  'Škoda': [
    'Fabia', 'Scala', 'Octavia', 'Superb',
    'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq',
    'Citigo', 'Rapid', 'Roomster', 'Yeti'
  ],
  'Hyundai': [
    'i10', 'i20', 'i30', 'i40',
    'Bayon', 'Kona', 'Tucson', 'Santa Fe', 'Palisade',
    'Ioniq', 'Ioniq 5', 'Ioniq 6',
    'Nexo', 'Staria', 'H-1'
  ],
  'Kia': [
    'Picanto', 'Rio', 'Ceed', 'ProCeed', 'Stinger',
    'Stonic', 'Niro', 'Sportage', 'Sorento', 'EV6', 'EV9',
    'Carnival', 'Soul', 'Telluride'
  ],
  'Nissan': [
    'Micra', 'Leaf', 'Pulsar', 'Sentra', 'Altima', 'Maxima',
    'Juke', 'Qashqai', 'X-Trail', 'Murano', 'Pathfinder', 'Patrol',
    'Ariya', 'GT-R', '370Z', 'Navara', 'Titan'
  ],
  'Mazda': [
    'Mazda2', 'Mazda3', 'Mazda6',
    'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-90',
    'MX-5', 'MX-30', 'RX-8'
  ],
  'Volvo': [
    'S60', 'S90', 'V60', 'V90',
    'XC40', 'XC60', 'XC90',
    'C40', 'EX30', 'EX90',
    'V40', 'V50', 'V70', 'S40', 'S80'
  ],
  'Fiat': [
    '500', '500X', '500L', '500e',
    'Panda', 'Tipo', 'Punto',
    'Doblo', 'Ducato', 'Fiorino', 'Talento',
    '124 Spider', 'Fullback'
  ],
  'Citroën': [
    'C1', 'C3', 'C4', 'C5',
    'C3 Aircross', 'C4 Cactus', 'C5 Aircross',
    'ë-C4', 'ë-Berlingo',
    'Berlingo', 'SpaceTourer', 'Jumpy', 'Jumper'
  ],
  'Seat': [
    'Mii', 'Ibiza', 'Leon', 'Toledo',
    'Arona', 'Ateca', 'Tarraco',
    'Alhambra', 'Cupra Born', 'Cupra Formentor', 'Cupra Leon'
  ],
  'Dacia': [
    'Sandero', 'Logan', 'Duster', 'Jogger', 'Spring',
    'Lodgy', 'Dokker'
  ],
  'Jeep': [
    'Renegade', 'Compass', 'Cherokee', 'Grand Cherokee',
    'Wrangler', 'Gladiator', 'Avenger',
    'Commander', 'Wagoneer'
  ],
  'Land Rover': [
    'Defender', 'Discovery', 'Discovery Sport',
    'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque',
    'Freelander'
  ],
  'Porsche': [
    '911', '718 Cayman', '718 Boxster',
    'Panamera', 'Taycan',
    'Macan', 'Cayenne'
  ],
  'Alfa Romeo': [
    'Giulia', 'Stelvio', 'Tonale',
    'Giulietta', 'MiTo', '4C',
    '159', '147', '156', 'Brera'
  ],
  'Subaru': [
    'Impreza', 'Legacy', 'WRX', 'BRZ',
    'XV', 'Forester', 'Outback', 'Ascent',
    'Solterra', 'Levorg'
  ],
  'Mitsubishi': [
    'Space Star', 'Colt', 'Lancer', 'Galant',
    'ASX', 'Eclipse Cross', 'Outlander',
    'Pajero', 'L200', 'i-MiEV'
  ],
  'Suzuki': [
    'Swift', 'Baleno', 'Ignis', 'Celerio',
    'Vitara', 'S-Cross', 'Jimny', 'Across',
    'SX4', 'Grand Vitara'
  ],
  'Lexus': [
    'CT', 'IS', 'ES', 'GS', 'LS',
    'UX', 'NX', 'RX', 'GX', 'LX',
    'LC', 'RC', 'LFA', 'RZ'
  ],
  'Infiniti': [
    'Q30', 'Q50', 'Q60', 'Q70',
    'QX30', 'QX50', 'QX55', 'QX60', 'QX80'
  ],
  'Tesla': [
    'Model S', 'Model 3', 'Model X', 'Model Y',
    'Cybertruck', 'Roadster'
  ],
  'Mini': [
    'Cooper', 'Cooper S', 'Clubman', 'Countryman',
    'Convertible', 'Electric', 'JCW'
  ],
  'Smart': [
    'ForTwo', 'ForFour', 'EQ ForTwo', 'EQ ForFour',
    '#1', '#3'
  ],
  'DS': [
    'DS 3', 'DS 4', 'DS 7', 'DS 9'
  ],
  'Jaguar': [
    'XE', 'XF', 'XJ',
    'E-Pace', 'F-Pace', 'I-Pace',
    'F-Type'
  ],
  'Aston Martin': [
    'Vantage', 'DB11', 'DBS', 'DBX',
    'Rapide', 'Vanquish', 'Valkyrie'
  ],
  'Ferrari': [
    '296 GTB', '296 GTS', 'SF90', 'F8', 'Roma',
    '812', 'Purosangue', 'Portofino'
  ],
  'Lamborghini': [
    'Huracán', 'Urus', 'Revuelto',
    'Aventador', 'Gallardo'
  ],
  'Maserati': [
    'Ghibli', 'Quattroporte', 'Levante', 'Grecale',
    'MC20', 'GranTurismo', 'GranCabrio'
  ],
  'Bentley': [
    'Continental GT', 'Flying Spur', 'Bentayga',
    'Mulsanne', 'Arnage'
  ],
  'Rolls-Royce': [
    'Ghost', 'Phantom', 'Wraith', 'Dawn',
    'Cullinan', 'Spectre'
  ],
  'Polestar': [
    'Polestar 1', 'Polestar 2', 'Polestar 3', 'Polestar 4'
  ],
  'Cupra': [
    'Born', 'Formentor', 'Leon', 'Ateca', 'Tavascan'
  ],
  'Genesis': [
    'G70', 'G80', 'G90',
    'GV60', 'GV70', 'GV80'
  ],
  'BYD': [
    'Atto 3', 'Han', 'Tang', 'Seal', 'Dolphin'
  ],
  'MG': [
    'MG3', 'MG4', 'MG5', 'ZS', 'HS', 'Marvel R',
    'Cyberster'
  ],
  'Lada': [
    'Granta', 'Vesta', 'XRAY', 'Niva', 'Largus',
    '4x4', 'Kalina', 'Priora'
  ],
  'Great Wall': [
    'Haval H6', 'Haval Jolion', 'Ora', 'Wey'
  ],
  'Chery': [
    'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo'
  ],
  'Geely': [
    'Coolray', 'Atlas', 'Tugella', 'Monjaro'
  ]
};

// Сортирани марки по азбучен ред
export const getBrands = () => {
  return Object.keys(carBrands).sort((a, b) => a.localeCompare(b));
};

// Модели за дадена марка
export const getModels = (brand) => {
  return carBrands[brand] || [];
};

export default carBrands;
