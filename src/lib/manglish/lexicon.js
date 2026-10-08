// The Manglish lexicon: how Kerala actually says numbers, units, times and
// shop items. Spellings are matched through skel() (normalize.js), so one entry
// covers "thakkali", "takkali" and "thakali". Malayalam script needs no entries:
// it is transliterated to these spellings first.

export const NUMBERS = {
  oru: 1, onnu: 1, onn: 1, one: 1, randu: 2, rand: 2, two: 2, moonu: 3, moonnu: 3, munnu: 3, three: 3,
  naalu: 4, four: 4, anju: 5, anchu: 5, five: 5, aaru: 6, six: 6, ezhu: 7, seven: 7, ettu: 8, eight: 8,
  ompathu: 9, onpathu: 9, nine: 9, pathu: 10, ten: 10, pathinonnu: 11, eleven: 11, panthrandu: 12, pandrandu: 12,
  twelve: 12, pathimoonnu: 13, pathinaalu: 14, pathinanju: 15, pathinaaru: 16, pathinezhu: 17,
  pathinettu: 18, pathompathu: 19, irupathu: 20, twenty: 20, irupathanju: 25, muppathu: 30, thirty: 30,
  naalpathu: 40, anpathu: 50, ampathu: 50, fifty: 50, arupathu: 60, ezhupathu: 70, enpathu: 80,
  thonnooru: 90, nooru: 100, hundred: 100, irunooru: 200, munnooru: 300, naanooru: 400, anjooru: 500,
  aayiram: 1000, thousand: 1000,
  // "and a half" is a suffix in Malayalam: onnara = 1½, anchara manikku = 5:30
  onnara: 1.5, randara: 2.5, moonara: 3.5, naalara: 4.5, anchara: 5.5, anjara: 5.5, aarara: 6.5,
  ezhara: 7.5, ettara: 8.5, ompathara: 9.5, pathara: 10.5, pathinonnara: 11.5, panthrandara: 12.5,
  ara: 0.5, half: 0.5, kaal: 0.25, quarter: 0.25, mukkaal: 0.75,
};
// Words that are numbers only next to a unit, an item or a clock word:
// "aaru" is also "who", "kaal" is also "leg", "oru" is also just "a".
export const WEAK_NUMBERS = new Set(['aaru', 'kaal', 'ara', 'oru', 'one', 'onnu', 'ettu']);

export const UNITS = {
  kg: ['kilo', 'kg', 'kgs', 'kilogram', 'kilograms', 'kilos', 'kgm', 'kilu'],
  g: ['gram', 'grams', 'gm', 'gms', 'g', 'graam', 'gr'],
  l: ['litre', 'liter', 'litres', 'liters', 'ltr', 'ltrs', 'lit', 'l', 'litter'],
  ml: ['ml', 'mls', 'millilitre'],
  packet: ['packet', 'packets', 'pkt', 'pkts', 'paakket', 'pakket', 'paakkattu', 'pakkattu', 'packattu', 'pack', 'packs', 'cover', 'kavar', 'covers', 'sachet'],
  bottle: ['kuppi', 'bottle', 'bottles'],
  dozen: ['dozen', 'dazan', 'dasan', 'doz'],
  piece: ['ennam', 'piece', 'pieces', 'pcs', 'pc', 'nos', 'enam'],
  bundle: ['kettu', 'bundle', 'kett'],
  box: ['box', 'petti', 'boxes'],
  tin: ['tin', 'dabba', 'tins'],
  bag: ['sanchi', 'bag', 'chaakku', 'sack', 'bags'],
  tray: ['tray', 'trays'],
  load: ['load', 'lod', 'loads'],
  '₹': ['rupees', 'rupee', 'rs', 'roopa', 'roopaykku', 'rupaykku', 'roopakku', 'rupakku', 'rupa', 'roopayude', 'rupees nu', 'rs nu'],
};
// Single words that already carry a quantity: "arakilo" = ½ kg.
export const QTY_UNITS = {
  arakilo: [0.5, 'kg'], kaalkilo: [0.25, 'kg'], mukkaalkilo: [0.75, 'kg'], onnarakilo: [1.5, 'kg'],
  aralitre: [0.5, 'l'], aralitter: [0.5, 'l'], halfkilo: [0.5, 'kg'],
};
export const UNIT_LABEL = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', packet: 'pkt', bottle: 'btl', dozen: 'doz', piece: 'pcs', bundle: 'bundle', box: 'box', tin: 'tin', bag: 'bag', tray: 'tray', load: 'load', '₹': '₹' };

// [English name, category, spoken forms]. Longer phrases win: "cheriya ulli"
// is shallots even though "ulli" alone is onion.
export const ITEMS = [
  // vegetables
  ['Onion', 'veg', ['savala', 'sawala', 'savola', 'onion', 'onions', 'valiya ulli', 'ulli', 'big onion']],
  ['Shallots', 'veg', ['cheriya ulli', 'chuvanna ulli', 'chumanna ulli', 'kunjulli', 'shallot', 'shallots', 'small onion']],
  ['Garlic', 'veg', ['veluthulli', 'velluthulli', 'veluthuli', 'garlic', 'poondu']],
  ['Ginger', 'veg', ['inji', 'inchi', 'ginger']],
  ['Tomato', 'veg', ['thakkali', 'tomato', 'tomatoes', 'tamatar']],
  ['Potato', 'veg', ['urulakizhangu', 'urulakkizhangu', 'urulan kizhangu', 'uruli kizhangu', 'potato', 'potatoes', 'aloo', 'batata', 'kizhangu']],
  ['Green chilli', 'veg', ['pacha mulaku', 'pachamulaku', 'pachamulak', 'green chilli', 'green chillies']],
  ['Chilli', 'veg', ['mulaku', 'mulak', 'chilli', 'chillies', 'mulagu']],
  ['Dry red chilli', 'spice', ['vattal mulaku', 'unakka mulaku', 'kollimulaku', 'dry chilli', 'red chilli']],
  ['Kanthari chilli', 'veg', ['kanthari', 'kanthari mulaku']],
  ['Carrot', 'veg', ['carrot', 'carrots', 'kerat', 'karat', 'kaarattu', 'kyaarattu']],
  ['Beans', 'veg', ['beans', 'bins']],
  ['Cabbage', 'veg', ['cabbage', 'cabage', 'kabeej', 'kaabej', 'kaabeju', 'kabej', 'mottakkoos', 'muttakose']],
  ['Cauliflower', 'veg', ['cauliflower', 'gobi', 'kaliflower']],
  ['Beetroot', 'veg', ['beetroot', 'beet', 'bitrut']],
  ['Okra', 'veg', ['vendakka', 'vendakkai', 'venda', 'ladies finger', 'ladiesfinger', 'ladys finger', 'lady finger']],
  ['Brinjal', 'veg', ['vazhuthananga', 'vazhuthana', 'vazhuthina', 'kathirikka', 'brinjal', 'eggplant']],
  ['Bitter gourd', 'veg', ['pavakka', 'paavakka', 'bitter gourd']],
  ['Snake gourd', 'veg', ['padavalanga', 'padavalam', 'snake gourd']],
  ['Pumpkin', 'veg', ['mathanga', 'mathan', 'pumpkin']],
  ['Ash gourd', 'veg', ['kumbalanga', 'kumbalam', 'elavan', 'ash gourd']],
  ['Cucumber', 'veg', ['vellarikka', 'vellari', 'kakkiri', 'cucumber']],
  ['Drumstick', 'veg', ['muringakka', 'muringa', 'drumstick', 'drumsticks']],
  ['Raw banana', 'veg', ['pacha kaaya', 'pachakaaya', 'kaaya', 'nendrakaaya', 'ethakkaya', 'plantain']],
  ['Yam', 'veg', ['chena', 'yam']],
  ['Colocasia', 'veg', ['chembu', 'taro', 'colocasia']],
  ['Tapioca', 'veg', ['kappa', 'tapioca', 'kolli', 'cassava']],
  ['Sweet potato', 'veg', ['madhurakizhangu', 'madhura kizhangu', 'sweet potato']],
  ['Spinach', 'veg', ['cheera', 'spinach', 'palak', 'chuvanna cheera']],
  ['Curry leaves', 'veg', ['kariveppila', 'karivepila', 'kariveppilla', 'curry leaves', 'curry leaf', 'curryveppila']],
  ['Coriander leaves', 'veg', ['malli ila', 'malliyila', 'kothamalli', 'kothamalli ila', 'coriander leaves', 'coriander leaf', 'malli leaf']],
  ['Mint', 'veg', ['pudina', 'puthina', 'mint']],
  ['Lemon', 'veg', ['naranga', 'cherunaranga', 'lemon', 'lemons', 'lime']],
  ['Coconut', 'veg', ['thenga', 'thengai', 'nalikeram', 'coconut', 'coconuts']],
  ['Capsicum', 'veg', ['capsicum', 'kapsikam']],
  ['Green peas', 'veg', ['green peas', 'peas', 'pattani']],
  ['Mushroom', 'veg', ['koonu', 'kumil', 'mushroom', 'mushrooms']],
  ['Long beans', 'veg', ['payar', 'achinga payar', 'achingapayar', 'vallipayar', 'long beans']],
  ['Cluster beans', 'veg', ['kothavara', 'amarakka', 'cluster beans']],
  ['Raw mango', 'veg', ['pacha manga', 'pachamanga', 'pacha maanga', 'raw mango']],
  ['Jackfruit', 'fruit', ['chakka', 'jackfruit']],
  // fruit
  ['Banana', 'fruit', ['pazham', 'banana', 'bananas', 'poovan pazham', 'poovan', 'robusta', 'palayankodan', 'njalipoovan']],
  ['Nendran banana', 'fruit', ['nendrapazham', 'nendra pazham', 'nendran', 'ethapazham', 'etha pazham', 'ethakka']],
  ['Mango', 'fruit', ['maanga', 'manga', 'mango', 'mangoes', 'mampazham']],
  ['Apple', 'fruit', ['apple', 'apples', 'aappil', 'appil']],
  ['Orange', 'fruit', ['orange', 'oranges', 'oranju', 'madhuranaranga', 'madhura naranga']],
  ['Sweet lime', 'fruit', ['mosambi', 'musambi', 'sweet lime']],
  ['Grapes', 'fruit', ['munthiri', 'munthiringa', 'grapes']],
  ['Pomegranate', 'fruit', ['maathalam', 'mathalanaranga', 'pomegranate']],
  ['Papaya', 'fruit', ['pappaya', 'kappalanga', 'omakka', 'karmoos', 'papaya']],
  ['Pineapple', 'fruit', ['kaithachakka', 'pineapple', 'painappil']],
  ['Watermelon', 'fruit', ['thannimathan', 'watermelon', 'tharbooz']],
  ['Guava', 'fruit', ['pera', 'perakka', 'guava']],
  ['Dates', 'fruit', ['eenthappazham', 'eenthapazham', 'dates', 'kaarakka']],
  // rice, flour, staples
  ['Rice', 'staple', ['ari', 'rice']],
  ['Matta rice', 'staple', ['matta ari', 'mattari', 'matta', 'kuthari', 'kuthari ari', 'red rice', 'rosematta']],
  ['Raw rice', 'staple', ['pachari', 'pacha ari', 'raw rice']],
  ['Ponni rice', 'staple', ['ponni', 'ponni ari']],
  ['Jaya rice', 'staple', ['jaya ari', 'jaya']],
  ['Biryani rice', 'staple', ['basmati', 'biriyani ari', 'biryani ari', 'kaima ari', 'kaima', 'jeerakasala']],
  ['Rice flour', 'staple', ['ari podi', 'aripodi', 'rice flour', 'puttu podi', 'puttupodi', 'appam podi', 'appampodi', 'pathiri podi']],
  ['Wheat flour', 'staple', ['atta', 'aatta', 'gothambu podi', 'gothambupodi', 'gothambu', 'wheat', 'wheat flour']],
  ['Maida', 'staple', ['maida', 'maidha']],
  ['Rava', 'staple', ['rava', 'ravva', 'sooji', 'semolina', 'upma rava']],
  ['Sugar', 'staple', ['panchasara', 'panjasara', 'panchara', 'sugar']],
  ['Jaggery', 'staple', ['sharkkara', 'sharkara', 'jaggery', 'vellam sharkkara']],
  ['Salt', 'staple', ['uppu', 'salt', 'podiyuppu', 'kalluppu']],
  ['Tea powder', 'staple', ['chaya podi', 'chaayapodi', 'chayapodi', 'tea podi', 'tea powder', 'theyila']],
  ['Coffee powder', 'staple', ['kaapi podi', 'kappi podi', 'kaappipodi', 'coffee podi', 'coffee powder']],
  ['Toor dal', 'staple', ['thuvara parippu', 'thuvara', 'thuvarapparippu', 'sambar parippu', 'toor dal']],
  ['Dal', 'staple', ['parippu', 'paripp', 'dal', 'dhal']],
  ['Green gram', 'staple', ['cherupayar', 'cheru payar', 'green gram', 'moong']],
  ['Urad dal', 'staple', ['uzhunnu', 'uzhunn', 'uzhunnu parippu', 'urad', 'urad dal']],
  ['Chickpeas', 'staple', ['kadala', 'vella kadala', 'vellakadala', 'chana', 'chickpeas', 'karuthakadala']],
  ['Cowpea', 'staple', ['vanpayar', 'van payar', 'cowpea']],
  ['Gram flour', 'staple', ['kadalamavu', 'kadala maavu', 'kadala podi', 'kadalapodi', 'besan']],
  ['Groundnut', 'staple', ['nilakkadala', 'kappalandi', 'groundnut', 'peanut', 'peanuts']],
  ['Beaten rice', 'staple', ['aval', 'avil', 'poha']],
  ['Vermicelli', 'staple', ['semiya', 'vermicelli', 'semiyan']],
  ['Oats', 'staple', ['oats']],
  // oils
  ['Coconut oil', 'oil', ['velichenna', 'velichena', 'coconut oil', 'thenga enna']],
  ['Oil', 'oil', ['enna', 'oil', 'cooking oil']],
  ['Sunflower oil', 'oil', ['sunflower oil', 'sunflower']],
  ['Sesame oil', 'oil', ['nallenna', 'gingelly oil', 'gingelly', 'sesame oil']],
  ['Palm oil', 'oil', ['palm oil', 'pamolein', 'palmolein', 'palmoil']],
  ['Ghee', 'dairy', ['neyyu', 'ney', 'ghee']],
  // spices
  ['Turmeric powder', 'spice', ['manjal podi', 'manjalpodi', 'manjal', 'turmeric', 'turmeric powder']],
  ['Chilli powder', 'spice', ['mulaku podi', 'mulakupodi', 'mulakpodi', 'chilli powder', 'kashmiri mulaku podi', 'kashmiri chilli']],
  ['Coriander powder', 'spice', ['malli podi', 'mallipodi', 'coriander powder', 'malli']],
  ['Garam masala', 'spice', ['garam masala', 'masala podi']],
  ['Sambar powder', 'spice', ['sambar podi', 'sambarpodi', 'sambar powder']],
  ['Chicken masala', 'spice', ['chicken masala']],
  ['Meat masala', 'spice', ['meat masala', 'irachi masala']],
  ['Pepper', 'spice', ['kurumulaku', 'kurumulak', 'pepper', 'kurumulaku podi']],
  ['Cumin', 'spice', ['jeerakam', 'jeeragam', 'nalla jeerakam', 'cumin']],
  ['Fennel', 'spice', ['perinjeerakam', 'perumjeerakam', 'fennel', 'saunf']],
  ['Mustard', 'spice', ['kaduku', 'kadugu', 'mustard']],
  ['Fenugreek', 'spice', ['uluva', 'fenugreek', 'methi']],
  ['Cardamom', 'spice', ['elakkaya', 'elakka', 'elaykka', 'cardamom', 'elaichi']],
  ['Cloves', 'spice', ['grambu', 'karayambu', 'karampu', 'cloves', 'clove']],
  ['Cinnamon', 'spice', ['karuvapatta', 'karuvapetta', 'patta', 'cinnamon']],
  ['Asafoetida', 'spice', ['kayam', 'kaayam', 'hing', 'asafoetida']],
  ['Tamarind', 'spice', ['puli', 'valanpuli', 'tamarind']],
  ['Kudampuli', 'spice', ['kudampuli', 'meen puli', 'kodampuli']],
  // dairy, eggs, bakery
  ['Milk', 'dairy', ['paal', 'pal', 'milk', 'milma', 'milma paal']],
  ['Curd', 'dairy', ['thairu', 'thayiru', 'thayir', 'curd', 'yogurt']],
  ['Buttermilk', 'dairy', ['moru', 'sambharam', 'buttermilk']],
  ['Butter', 'dairy', ['butter', 'venna']],
  ['Paneer', 'dairy', ['paneer']],
  ['Cheese', 'dairy', ['cheese']],
  ['Egg', 'dairy', ['mutta', 'mutt', 'egg', 'eggs', 'kozhimutta']],
  ['Duck egg', 'dairy', ['tharavu mutta', 'tharavumutta', 'duck egg']],
  ['Bread', 'bakery', ['bread', 'bredu', 'brad', 'rotti', 'bun']],
  ['Biscuit', 'bakery', ['biscuit', 'biscuits', 'biskat', 'bisket']],
  ['Rusk', 'bakery', ['rusk']],
  ['Cake', 'bakery', ['cake']],
  ['Noodles', 'bakery', ['noodles', 'maggi', 'yippee']],
  ['Pappadam', 'staple', ['pappadam', 'pappadum', 'papad', 'pappad', 'pappadom']],
  ['Pickle', 'staple', ['achar', 'achaar', 'pickle']],
  ['Ketchup', 'staple', ['ketchup', 'tomato sauce', 'sauce']],
  // meat and fish
  ['Chicken', 'meat', ['kozhi', 'kozhiyirachi', 'kozhi irachi', 'chicken', 'broiler']],
  ['Beef', 'meat', ['beef', 'pothirachi', 'maattirachi', 'beef irachi', 'poth']],
  ['Mutton', 'meat', ['mutton', 'aattirachi', 'aadu irachi']],
  ['Pork', 'meat', ['pork', 'panniyirachi']],
  ['Fish', 'fish', ['meen', 'fish']],
  ['Sardine', 'fish', ['mathi', 'chaala', 'chala', 'sardine', 'sardines']],
  ['Mackerel', 'fish', ['ayala', 'aila', 'mackerel']],
  ['Prawns', 'fish', ['chemmeen', 'chemmen', 'konju', 'prawns', 'prawn', 'shrimp']],
  ['Tuna', 'fish', ['choora', 'chura', 'tuna']],
  ['Seer fish', 'fish', ['neymeen', 'ney meen', 'aikoora', 'seer fish', 'king fish', 'kingfish']],
  ['Pearl spot', 'fish', ['karimeen', 'pearl spot']],
  ['Anchovy', 'fish', ['netholi', 'kozhuva', 'anchovy']],
  ['Squid', 'fish', ['koonthal', 'kanava', 'squid']],
  ['Crab', 'fish', ['njandu', 'crab']],
  ['Pomfret', 'fish', ['avoli', 'aavoli', 'pomfret']],
  // household
  ['Soap', 'home', ['soap', 'sopp', 'soppu', 'bath soap', 'kulisoap']],
  ['Washing powder', 'home', ['washing powder', 'soap podi', 'soappodi', 'detergent']],
  ['Dishwash bar', 'home', ['dishwash', 'dish wash', 'vim bar', 'dishwash bar']],
  ['Toothpaste', 'home', ['paste', 'toothpaste', 'tooth paste']],
  ['Toothbrush', 'home', ['toothbrush', 'brush']],
  ['Shampoo', 'home', ['shampoo']],
  ['Matchbox', 'home', ['theeppetti', 'theepetti', 'matchbox', 'match box']],
  ['Candle', 'home', ['mezhukuthiri', 'candle', 'candles']],
  ['Mosquito coil', 'home', ['kothuku thiri', 'kothukuthiri', 'mosquito coil', 'coil']],
  ['Agarbatti', 'home', ['chandanathiri', 'agarbathi', 'agarbatti', 'incense']],
  ['Kerosene', 'home', ['mannenna', 'kerosene']],
  ['Gas cylinder', 'home', ['gas cylinder', 'cylinder', 'gas kutti']],
  ['Drinking water', 'home', ['kudivellam', 'water can', 'water bottle', 'mineral water']],
  ['Diapers', 'home', ['diaper', 'diapers', 'pampers']],
  ['Tissue', 'home', ['tissue', 'tissue paper']],
  // building material (small hardware shops)
  ['Cement', 'build', ['cement', 'simentu', 'siment']],
  ['Sand', 'build', ['manal', 'mannu', 'sand', 'm sand', 'msand']],
  ['Bricks', 'build', ['brick', 'bricks', 'ishtika']],
];

export const DAY_OFFSETS = {
  innu: 0, inn: 0, today: 0, tonight: 0, nale: 1, naale: 1, nalle: 1, nalea: 1, tomorrow: 1, tmrw: 1, tmw: 1,
  mattannal: 2, mattennal: 2, mattanal: 2, 'day after tomorrow': 2, innale: -1, yesterday: -1,
};
export const WEEKDAYS = {
  njayar: 0, njayarazhcha: 0, nyayar: 0, sunday: 0, sun: 0,
  thinkal: 1, thinkalazhcha: 1, thingal: 1, thingalazhcha: 1, monday: 1, mon: 1,
  chovva: 2, chovvazhcha: 2, chowva: 2, tuesday: 2, tue: 2,
  budhan: 3, budhanazhcha: 3, budan: 3, budhanaazhcha: 3, wednesday: 3, wed: 3,
  vyazham: 4, vyazhazhcha: 4, viyazham: 4, vyaazham: 4, thursday: 4, thu: 4,
  velli: 5, velliyazhcha: 5, velliazhcha: 5, friday: 5, fri: 5,
  shani: 6, shaniyazhcha: 6, sani: 6, saniyazhcha: 6, saturday: 6, sat: 6,
};
export const MONTHS = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5, june: 6, jun: 6,
  july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9, october: 10, oct: 10,
  november: 11, nov: 11, december: 12, dec: 12,
};
export const NEXT_WORDS = ['adutha', 'aduttha', 'next', 'varunna', 'coming'];
export const WEEK_WORDS = ['azhcha', 'aazhcha', 'week'];
export const MONTH_WORDS = ['masam', 'maasam', 'month'];
export const DATE_WORDS = ['theethi', 'thiyathi', 'tharikh', 'date'];

// part of day -> [default clock time, meridiem hint]
export const DAYPARTS = {
  pularche: ['05:30', 'am'], pularcha: ['05:30', 'am'],
  raavile: ['09:00', 'am'], ravile: ['09:00', 'am'], ravila: ['09:00', 'am'], morning: ['09:00', 'am'], mrng: ['09:00', 'am'],
  uchakku: ['13:00', 'noon'], uchaykku: ['13:00', 'noon'], ucha: ['13:00', 'noon'], noon: ['12:00', 'noon'], lunch: ['13:00', 'noon'],
  uchakazhinju: ['15:00', 'pm'], 'ucha kazhinju': ['15:00', 'pm'], afternoon: ['15:00', 'pm'],
  vaikunneram: ['17:00', 'pm'], vaikunnaram: ['17:00', 'pm'], vaikittu: ['17:00', 'pm'], vaikitt: ['17:00', 'pm'],
  vaikeettu: ['17:00', 'pm'], evening: ['17:00', 'pm'], eve: ['17:00', 'pm'],
  rathri: ['20:00', 'pm'], raathri: ['20:00', 'pm'], night: ['20:00', 'pm'], tonight: ['20:00', 'pm'],
};
export const CLOCK_WORDS = ['manikku', 'mani', 'manik', 'oclock', 'am', 'pm', 'hrs', 'baje'];

// Verbs that make a clause an order (to a shop) or a shopping list (to family).
export const ORDER_WORDS = [
  'venam', 'venum', 'veenam', 'vennam', 'vende', 'edukkanam', 'edukku', 'edutho', 'eduthu', 'edutholu', 'tharanam',
  'tharu', 'tharumo', 'thero', 'ayakkanam', 'ayakku', 'ayachu', 'deliver', 'delivery', 'order', 'pack', 'packing',
  'kittumo', 'undo', 'stock', 'vaanganam', 'vaangikkanam', 'vaangi', 'vangi', 'vanganam', 'vangikkanam', 'medikkanam',
  'medichu', 'medikku', 'buy', 'konduvaranam', 'kondu', 'ethikkanam', 'ethikku', 'ethichu', 'ethikkamo', 'deliver cheyyanam',
  'edukkam', 'vaangikko', 'vangikko', 'vaangicho', 'medicho', 'medichoo', 'kondu varamo', 'cheyyamo', 'tharamo', 'ayakkamo',
];
// "class illa": no event. Checked per clause.
export const NEG_WORDS = ['illa', 'illaa', 'ella', 'illallo', 'cancel', 'cancelled'];
export const CANCEL_WORDS = ['venda', 'vendaa', 'vendatha', 'cancel', 'cancelled', 'ozhivakku'];

// Obligation/request verbs -> English verb for the to-do title.
export const TODO_VERBS = {
  vilikkanam: 'Call', vilikku: 'Call', vilikkane: 'Call', vilikkan: 'Call', call: 'Call',
  adakkanam: 'Pay', adakkan: 'Pay', adaykkanam: 'Pay', pay: 'Pay',
  kodukkanam: 'Give', kodukku: 'Give', kodukkane: 'Give', kodukkan: 'Give',
  vaanganam: 'Buy', vaangikkanam: 'Buy', vanganam: 'Buy', vangikkanam: 'Buy', medikkanam: 'Buy', medikku: 'Buy', buy: 'Buy',
  konduvaranam: 'Bring', 'kondu varanam': 'Bring', 'kondu vaa': 'Bring',
  kondupokanam: 'Take', 'kondu pokanam': 'Take', 'kondu poyi': 'Take',
  ayakkanam: 'Send', ayakku: 'Send', send: 'Send',
  nokkanam: 'Check', nokku: 'Check', check: 'Check',
  'eduthu vekkanam': 'Keep ready', 'eduthu vaykkanam': 'Keep ready', eduthuvekkanam: 'Keep ready', 'ready aakkanam': 'Get ready',
  ormippikkanam: 'Remind', ormippikku: 'Remind', remind: 'Remind',
  kazhikkanam: 'Take', kazhikkan: 'Take', kazhikku: 'Take',
  pokanam: 'Go to', povanam: 'Go to', pokan: 'Go to',
  kaananam: 'Meet', kaanan: 'Meet',
  ezhuthanam: 'Write', ezhuthan: 'Write',
  koottanam: 'Pick up', koottan: 'Pick up', 'koottikondu varanam': 'Pick up',
  vidanam: 'Drop', 'kondu vidanam': 'Drop',
  parayanam: 'Tell', parayan: 'Tell', vilichu: 'Call', edukkanam: 'Pick up', renew: 'Renew', book: 'Book',
  thurakkanam: 'Open', mattanam: 'Change', mattan: 'Change', cheyyanam: '', cheyyu: '', cheyyane: '', cheyyan: '', cheythu: '',
  vekkanam: 'Keep', vaykkanam: 'Keep', varanam: 'Come',
  marakkalle: '', marakkaruthu: '', marakkenda: '', marakkanda: '', 'marannu pokalle': '',
};
// Nouns that make a clause with a date or time a calendar event.
export const EVENT_WORDS = [
  'meeting', 'appointment', 'function', 'kalyanam', 'kalyaanam', 'wedding', 'marriage', 'birthday', 'piranal',
  'party', 'class', 'exam', 'pareeksha', 'interview', 'doctor', 'hospital', 'checkup', 'train', 'flight', 'bus',
  'trip', 'yathra', 'temple', 'ambalam', 'palli', 'pooja', 'festival', 'utsavam', 'match', 'movie', 'cinema',
  'padam', 'visit', 'engagement', 'nischayam', 'housewarming', 'gruhapravesham', 'seminar', 'presentation',
  'review', 'demo', 'pta', 'program', 'programme', 'event', 'conference', 'webinar', 'call', 'session', 'tuition',
  'practice', 'shoot', 'mass', 'kurbana', 'namaskaram', 'jumma', 'onam', 'vishu', 'christmas', 'eid', 'retreat',
  'vaccination', 'vaccine', 'injection', 'scan', 'test', 'blood test', 'dinner', 'lunch', 'breakfast', 'zoom', 'gmeet',
  'ambalathil', 'pallyil', 'functionu', 'reception', 'counselling', 'ceremony', 'anniversary', 'shift',
];
// "is/will be" words that turn "nale meeting und" into an event.
export const EVENT_VERBS = ['und', 'undu', 'undallo', 'varum', 'varunnund', 'ethum', 'ethanam', 'thudangum', 'start', 'aanu', 'anu', 'irikkum', 'nadakkum'];

export const SPLITTERS = ['pinne', 'pinna', 'pinnem', 'pinneyum', 'ennittu', 'also', 'then', 'athu kazhinju', 'athinu shesham', 'next'];
export const FILLERS = [
  'chetta', 'chettaa', 'chechi', 'mole', 'mone', 'eda', 'edi', 'aliya', 'aliyaa', 'machane', 'machan', 'bro', 'dear',
  'sir', 'madam', 'maam', 'hello', 'hi', 'helo', 'ok', 'okay', 'oke', 'sheri', 'shari', 'ketto', 'keto', 'tto', 'alle',
  'please', 'pls', 'plz', 'athe', 'ha', 'haa', 'hm', 'hmm', 'nammude', 'ente', 'enikku', 'ninte', 'njan', 'nee',
  'ningal', 'ningalu', 'aa', 'ee', 'kurachu', 'koode', 'ellam', 'okke', 'thanne', 'vegam', 'ippo', 'pettannu',
  'nokki', 'nalla', 'fresh', 'onnu', 'ithu', 'athu', 'ini', 'just', 'pinne', 'um', 'and', 'the', 'a', 'to', 'for',
  'of', 'with', 'il', 'ilu', 'il ninnu', 'ninnu', 'vannittu', 'varumbo', 'varumbol', 'pokumbo', 'pokumbol', 'appo',
  'appol', 'sare', 'saare', 'ikka', 'itha', 'nokkatte', 'parayam', 'paranju', 'paranjo', 'ennu', 'karyam',
  'kku', 'ku', 'nu', 'nnu', 'inu', 'nte', 'inte', 'ude', 'ilekku', 'lekku',   // suffixes split off by a hyphen: "5:30-kku"
  'kaaryam', 'saadhanam', 'sadhanam', 'saadhanangal', 'list', 'idh', 'ingane', 'angane', 'avide', 'ivide', 'enthayalum',
  'orkkane', 'sradhikkane', 'shraddhikkane', 'mathiyo', 'kollam', 'thank', 'thanks', 'you',
];
// Family and work words kept in Manglish in titles ("Amma", "Achan"), the way people say them.
export const PEOPLE = [
  'amma', 'achan', 'acha', 'appa', 'chettan', 'chechi', 'aniyan', 'aniyathi', 'mon', 'mol', 'makan', 'makal',
  'ammamma', 'ammooma', 'appooppan', 'appuppan', 'muthassi', 'muthachan', 'valyamma', 'valyachan', 'ilayamma',
  'cheriyachan', 'kunjamma', 'kunjachan', 'maaman', 'mama', 'ammayi', 'umma', 'uppa', 'vappa', 'ettan', 'ettathi',
  'kutti', 'kuttikal', 'makkal', 'teacher', 'boss', 'manager', 'electrician', 'plumber', 'driver',
  'ammavan', 'ammaavan', 'kunju', 'kunj', 'guests', 'guest', 'staff', 'client', 'customer', 'mechanic', 'delivery boy',
];
// Common nouns the rule parser can put into English to-do titles.
export const NOUNS = {
  marunnu: 'medicine', marunn: 'medicine', tablet: 'tablet', gulika: 'tablet', 'current bill': 'electricity bill',
  'karent bill': 'electricity bill', 'kseb bill': 'electricity bill', current: 'electricity', 'vellam bill': 'water bill',
  'water bill': 'water bill', vaadaka: 'rent', vadaka: 'rent', rent: 'rent', fees: 'fees', fee: 'fee', kaash: 'money',
  kash: 'money', paisa: 'money', panam: 'money', kada: 'shop', veedu: 'house', veettil: 'home', school: 'school',
  schoolil: 'school', office: 'office', officil: 'office', bank: 'bank', bankil: 'bank', report: 'report',
  reports: 'reports', file: 'file', files: 'files', vandi: 'vehicle', car: 'car', bike: 'bike', scooter: 'scooter',
  service: 'service', recharge: 'recharge', pusthakam: 'book', book: 'book', tuni: 'clothes', dress: 'dress',
  vellam: 'water', chedi: 'plants', patti: 'dog', poocha: 'cat', gate: 'gate', vaathil: 'door', light: 'light',
  fan: 'fan', motor: 'motor', tank: 'tank', parcel: 'parcel', courier: 'courier', key: 'key', thakkol: 'key',
  form: 'form', certificate: 'certificate', photo: 'photo', id: 'ID', aadhaar: 'Aadhaar', passport: 'passport',
  vaccination: 'vaccination', booking: 'booking', gst: 'GST', invoice: 'invoice', salary: 'salary', insurance: 'insurance',
  kuri: 'chitty', chitty: 'chitty', emi: 'EMI', loan: 'loan', stock: 'stock',
  kalyanam: 'wedding', kalyaanam: 'wedding', piranal: 'birthday', pareeksha: 'exam', ambalam: 'temple',
  yathra: 'trip', padam: 'movie', nischayam: 'engagement', gruhapravesham: 'housewarming', palli: 'church',
  aduthu: '', aduth: '', adukkal: '', koode: 'with', kooode: 'with', veettil: 'home', veetil: 'home', veettilekku: 'home',
};
// How people are shown in titles: "ammaye vilikkanam" -> "Call Amma".
export const PERSON_DISPLAY = { kunj: 'Kunju', acha: 'Achan', appa: 'Appa', mon: 'Mon', mol: 'Mol', mama: 'Maaman' };
