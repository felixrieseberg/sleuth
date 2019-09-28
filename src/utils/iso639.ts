/**
 * @module Utilities
 */ /** for typedoc */

 import { StringMap } from '../shared-constants';

 export interface Iso639Language {
   name: string;
   nativeName: string;
 }

 export interface Language extends Iso639Language {
   label: string;
   key: string;
   selected?: boolean;
 }

 export interface GetLanguageNamesOptions {
   includeEnglishNames: boolean;
 }

 export const languages: StringMap<Iso639Language> = {
   ab: {
     name: 'Abkhaz',
     nativeName: 'Аҧсуа'
   },
   aa: {
     name: 'Afar',
     nativeName: 'Afaraf'
   },
   af: {
     name: 'Afrikaans',
     nativeName: 'Afrikaans'
   },
   ak: {
     name: 'Akan',
     nativeName: 'Akan'
   },
   sq: {
     name: 'Albanian',
     nativeName: 'Shqip'
   },
   am: {
     name: 'Amharic',
     nativeName: 'አማርኛ'
   },
   ar: {
     name: 'Arabic',
     nativeName: 'العربية'
   },
   an: {
     name: 'Aragonese',
     nativeName: 'Aragonés'
   },
   hy: {
     name: 'Armenian',
     nativeName: 'Հայերեն'
   },
   as: {
     name: 'Assamese',
     nativeName: 'অসমীয়া'
   },
   av: {
     name: 'Avaric',
     nativeName: 'Авар мацӀ, магӀарул мацӀ'
   },
   ae: {
     name: 'Avestan',
     nativeName: 'Avesta'
   },
   ay: {
     name: 'Aymara',
     nativeName: 'Aymar aru'
   },
   az: {
     name: 'Azerbaijani',
     nativeName: 'Azərbaycan dili'
   },
   bm: {
     name: 'Bambara',
     nativeName: 'Bamanankan'
   },
   ba: {
     name: 'Bashkir',
     nativeName: 'Башҡорт теле'
   },
   eu: {
     name: 'Basque',
     nativeName: 'Euskara, euskera'
   },
   be: {
     name: 'Belarusian',
     nativeName: 'Беларуская'
   },
   bn: {
     name: 'Bengali',
     nativeName: 'বাংলা'
   },
   bh: {
     name: 'Bihari',
     nativeName: 'भोजपुरी'
   },
   bi: {
     name: 'Bislama',
     nativeName: 'Bislama'
   },
   bs: {
     name: 'Bosnian',
     nativeName: 'Bosanski jezik'
   },
   br: {
     name: 'Breton',
     nativeName: 'Brezhoneg'
   },
   bg: {
     name: 'Bulgarian',
     nativeName: 'Български език'
   },
   my: {
     name: 'Burmese',
     nativeName: 'ဗမာစာ'
   },
   ca: {
     name: 'Catalan; Valencian',
     nativeName: 'Català'
   },
   ch: {
     name: 'Chamorro',
     nativeName: 'Chamoru'
   },
   ce: {
     name: 'Chechen',
     nativeName: 'Нохчийн мотт'
   },
   ny: {
     name: 'Chichewa; Chewa; Nyanja',
     nativeName: 'ChiCheŵa, chinyanja'
   },
   zh: {
     name: 'Chinese',
     nativeName: '中文 (Zhōngwén), 汉语, 漢語'
   },
   cv: {
     name: 'Chuvash',
     nativeName: 'Чӑваш чӗлхи'
   },
   kw: {
     name: 'Cornish',
     nativeName: 'Kernewek'
   },
   co: {
     name: 'Corsican',
     nativeName: 'Corsu, lingua corsa'
   },
   cr: {
     name: 'Cree',
     nativeName: 'ᓀᐦᐃᔭᐍᐏᐣ'
   },
   hr: {
     name: 'Croatian',
     nativeName: 'Hrvatski'
   },
   cs: {
     name: 'Czech',
     nativeName: 'Česky, čeština'
   },
   da: {
     name: 'Danish',
     nativeName: 'Dansk'
   },
   dv: {
     name: 'Divehi; Dhivehi; Maldivian;',
     nativeName: 'ދިވެހި'
   },
   nl: {
     name: 'Dutch',
     nativeName: 'Nederlands, Vlaams'
   },
   en: {
     name: 'English',
     nativeName: 'English'
   },
   eo: {
     name: 'Esperanto',
     nativeName: 'Esperanto'
   },
   et: {
     name: 'Estonian',
     nativeName: 'Eesti, eesti keel'
   },
   ee: {
     name: 'Ewe',
     nativeName: 'Eʋegbe'
   },
   fo: {
     name: 'Faroese',
     nativeName: 'Føroyskt'
   },
   fj: {
     name: 'Fijian',
     nativeName: 'Vosa Vakaviti'
   },
   fi: {
     name: 'Finnish',
     nativeName: 'Suomi, suomen kieli'
   },
   fr: {
     name: 'French',
     nativeName: 'Français'
   },
   ff: {
     name: 'Fula; Fulah; Pulaar; Pular',
     nativeName: 'Fulfulde, Pulaar, Pular'
   },
   gl: {
     name: 'Galician',
     nativeName: 'Galego'
   },
   ka: {
     name: 'Georgian',
     nativeName: 'ქართული'
   },
   de: {
     name: 'German',
     nativeName: 'Deutsch'
   },
   el: {
     name: 'Greek, Modern',
     nativeName: 'Ελληνικά'
   },
   gn: {
     name: 'Guaraní',
     nativeName: 'Avañeẽ'
   },
   gu: {
     name: 'Gujarati',
     nativeName: 'ગુજરાતી'
   },
   ht: {
     name: 'Haitian; Haitian Creole',
     nativeName: 'Kreyòl ayisyen'
   },
   ha: {
     name: 'Hausa',
     nativeName: 'Hausa, هَوُسَ'
   },
   he: {
     name: 'Hebrew (modern)',
     nativeName: 'עברית'
   },
   hz: {
     name: 'Herero',
     nativeName: 'Otjiherero'
   },
   hi: {
     name: 'Hindi',
     nativeName: 'हिन्दी, हिंदी'
   },
   ho: {
     name: 'Hiri Motu',
     nativeName: 'Hiri Motu'
   },
   hu: {
     name: 'Hungarian',
     nativeName: 'Magyar'
   },
   ia: {
     name: 'Interlingua',
     nativeName: 'Interlingua'
   },
   id: {
     name: 'Indonesian',
     nativeName: 'Bahasa Indonesia'
   },
   ie: {
     name: 'Interlingue',
     nativeName: 'Originally called Occidental; then Interlingue after WWII'
   },
   ga: {
     name: 'Irish',
     nativeName: 'Gaeilge'
   },
   ig: {
     name: 'Igbo',
     nativeName: 'Asụsụ Igbo'
   },
   ik: {
     name: 'Inupiaq',
     nativeName: 'Iñupiaq, Iñupiatun'
   },
   io: {
     name: 'Ido',
     nativeName: 'Ido'
   },
   is: {
     name: 'Icelandic',
     nativeName: 'Íslenska'
   },
   it: {
     name: 'Italian',
     nativeName: 'Italiano'
   },
   iu: {
     name: 'Inuktitut',
     nativeName: 'ᐃᓄᒃᑎᑐᑦ'
   },
   ja: {
     name: 'Japanese',
     nativeName: '日本語 (にほんご／にっぽんご)'
   },
   jv: {
     name: 'Javanese',
     nativeName: 'Basa Jawa'
   },
   kl: {
     name: 'Kalaallisut, Greenlandic',
     nativeName: 'Kalaallisut, kalaallit oqaasii'
   },
   kn: {
     name: 'Kannada',
     nativeName: 'ಕನ್ನಡ'
   },
   kr: {
     name: 'Kanuri',
     nativeName: 'Kanuri'
   },
   ks: {
     name: 'Kashmiri',
     nativeName: 'कश्मीरी, كشميري‎'
   },
   kk: {
     name: 'Kazakh',
     nativeName: 'Қазақ тілі'
   },
   km: {
     name: 'Khmer',
     nativeName: 'ភាសាខ្មែរ'
   },
   ki: {
     name: 'Kikuyu, Gikuyu',
     nativeName: 'Gĩkũyũ'
   },
   rw: {
     name: 'Kinyarwanda',
     nativeName: 'Ikinyarwanda'
   },
   ky: {
     name: 'Kirghiz, Kyrgyz',
     nativeName: 'Кыргыз тили'
   },
   kv: {
     name: 'Komi',
     nativeName: 'Коми кыв'
   },
   kg: {
     name: 'Kongo',
     nativeName: 'KiKongo'
   },
   ko: {
     name: 'Korean',
     nativeName: '한국어'
   },
   ku: {
     name: 'Kurdish',
     nativeName: 'Kurdî, كوردی‎'
   },
   kj: {
     name: 'Kwanyama, Kuanyama',
     nativeName: 'Kuanyama'
   },
   la: {
     name: 'Latin',
     nativeName: 'Latine, lingua latina'
   },
   lb: {
     name: 'Luxembourgish, Letzeburgesch',
     nativeName: 'Lëtzebuergesch'
   },
   lg: {
     name: 'Luganda',
     nativeName: 'Luganda'
   },
   li: {
     name: 'Limburgish, Limburgan, Limburger',
     nativeName: 'Limburgs'
   },
   ln: {
     name: 'Lingala',
     nativeName: 'Lingála'
   },
   lo: {
     name: 'Lao',
     nativeName: 'ພາສາລາວ'
   },
   lt: {
     name: 'Lithuanian',
     nativeName: 'Lietuvių kalba'
   },
   lu: {
     name: 'Luba-Katanga',
     nativeName: ''
   },
   lv: {
     name: 'Latvian',
     nativeName: 'Latviešu valoda'
   },
   gv: {
     name: 'Manx',
     nativeName: 'Gaelg, Gailck'
   },
   mk: {
     name: 'Macedonian',
     nativeName: 'Македонски јазик'
   },
   mg: {
     name: 'Malagasy',
     nativeName: 'Malagasy fiteny'
   },
   ms: {
     name: 'Malay',
     nativeName: 'Bahasa Melayu, بهاس ملايو‎'
   },
   ml: {
     name: 'Malayalam',
     nativeName: 'മലയാളം'
   },
   mt: {
     name: 'Maltese',
     nativeName: 'Malti'
   },
   mi: {
     name: 'Māori',
     nativeName: 'Te reo Māori'
   },
   mr: {
     name: 'Marathi (Marāṭhī)',
     nativeName: 'मराठी'
   },
   mh: {
     name: 'Marshallese',
     nativeName: 'Kajin M̧ajeļ'
   },
   mn: {
     name: 'Mongolian',
     nativeName: 'Монгол'
   },
   na: {
     name: 'Nauru',
     nativeName: 'Ekakairũ Naoero'
   },
   nv: {
     name: 'Navajo, Navaho',
     nativeName: 'Diné bizaad, Dinékʼehǰí'
   },
   nb: {
     name: 'Norwegian Bokmål',
     nativeName: 'Norsk bokmål'
   },
   nd: {
     name: 'North Ndebele',
     nativeName: 'IsiNdebele'
   },
   ne: {
     name: 'Nepali',
     nativeName: 'नेपाली'
   },
   ng: {
     name: 'Ndonga',
     nativeName: 'Owambo'
   },
   nn: {
     name: 'Norwegian Nynorsk',
     nativeName: 'Norsk nynorsk'
   },
   no: {
     name: 'Norwegian',
     nativeName: 'Norsk'
   },
   ii: {
     name: 'Nuosu',
     nativeName: 'ꆈꌠ꒿ Nuosuhxop'
   },
   nr: {
     name: 'South Ndebele',
     nativeName: 'IsiNdebele'
   },
   oc: {
     name: 'Occitan',
     nativeName: 'Occitan'
   },
   oj: {
     name: 'Ojibwe, Ojibwa',
     nativeName: 'ᐊᓂᔑᓈᐯᒧᐎᓐ'
   },
   cu: {
     name: 'Old Church Slavonic, Church Slavic, Church Slavonic, Old Bulgarian, Old Slavonic',
     nativeName: 'Ѩзыкъ словѣньскъ'
   },
   om: {
     name: 'Oromo',
     nativeName: 'Afaan Oromoo'
   },
   or: {
     name: 'Oriya',
     nativeName: 'ଓଡ଼ିଆ'
   },
   os: {
     name: 'Ossetian, Ossetic',
     nativeName: 'Ирон æвзаг'
   },
   pa: {
     name: 'Panjabi, Punjabi',
     nativeName: 'ਪੰਜਾਬੀ, پنجابی‎'
   },
   pi: {
     name: 'Pāli',
     nativeName: 'पाऴि'
   },
   fa: {
     name: 'Persian',
     nativeName: 'فارسی'
   },
   pl: {
     name: 'Polish',
     nativeName: 'Polski'
   },
   ps: {
     name: 'Pashto, Pushto',
     nativeName: 'پښتو'
   },
   pt: {
     name: 'Portuguese',
     nativeName: 'Português'
   },
   qu: {
     name: 'Quechua',
     nativeName: 'Runa Simi, Kichwa'
   },
   rm: {
     name: 'Romansh',
     nativeName: 'Rumantsch grischun'
   },
   rn: {
     name: 'Kirundi',
     nativeName: 'KiRundi'
   },
   ro: {
     name: 'Romanian, Moldavian, Moldovan',
     nativeName: 'Română'
   },
   ru: {
     name: 'Russian',
     nativeName: 'Русский язык'
   },
   sa: {
     name: 'Sanskrit (Saṁskṛta)',
     nativeName: 'संस्कृतम्'
   },
   sc: {
     name: 'Sardinian',
     nativeName: 'Sardu'
   },
   sd: {
     name: 'Sindhi',
     nativeName: 'सिन्धी, سنڌي، سندھی‎'
   },
   se: {
     name: 'Northern Sami',
     nativeName: 'Davvisámegiella'
   },
   sm: {
     name: 'Samoan',
     nativeName: 'Gagana faa Samoa'
   },
   sg: {
     name: 'Sango',
     nativeName: 'Yângâ tî sängö'
   },
   sr: {
     name: 'Serbian',
     nativeName: 'Српски језик'
   },
   gd: {
     name: 'Scottish Gaelic; Gaelic',
     nativeName: 'Gàidhlig'
   },
   sn: {
     name: 'Shona',
     nativeName: 'ChiShona'
   },
   si: {
     name: 'Sinhala, Sinhalese',
     nativeName: 'සිංහල'
   },
   sk: {
     name: 'Slovak',
     nativeName: 'Slovenčina'
   },
   sl: {
     name: 'Slovene',
     nativeName: 'Slovenščina'
   },
   so: {
     name: 'Somali',
     nativeName: 'Soomaaliga, af Soomaali'
   },
   st: {
     name: 'Southern Sotho',
     nativeName: 'Sesotho'
   },
   es: {
     name: 'Spanish; Castilian',
     nativeName: 'Español, castellano'
   },
   su: {
     name: 'Sundanese',
     nativeName: 'Basa Sunda'
   },
   sw: {
     name: 'Swahili',
     nativeName: 'Kiswahili'
   },
   ss: {
     name: 'Swati',
     nativeName: 'SiSwati'
   },
   sv: {
     name: 'Swedish',
     nativeName: 'Svenska'
   },
   ta: {
     name: 'Tamil',
     nativeName: 'தமிழ்'
   },
   te: {
     name: 'Telugu',
     nativeName: 'తెలుగు'
   },
   tg: {
     name: 'Tajik',
     nativeName: 'Тоҷикӣ, toğikī, تاجیکی‎'
   },
   th: {
     name: 'Thai',
     nativeName: 'ไทย'
   },
   ti: {
     name: 'Tigrinya',
     nativeName: 'ትግርኛ'
   },
   bo: {
     name: 'Tibetan Standard, Tibetan, Central',
     nativeName: 'བོད་ཡིག'
   },
   tk: {
     name: 'Turkmen',
     nativeName: 'Türkmen, Түркмен'
   },
   tl: {
     name: 'Tagalog',
     nativeName: 'Wikang Tagalog, ᜏᜒᜃᜅ᜔ ᜆᜄᜎᜓᜄ᜔'
   },
   tn: {
     name: 'Tswana',
     nativeName: 'Setswana'
   },
   to: {
     name: 'Tonga (Tonga Islands)',
     nativeName: 'Faka Tonga'
   },
   tr: {
     name: 'Turkish',
     nativeName: 'Türkçe'
   },
   ts: {
     name: 'Tsonga',
     nativeName: 'Xitsonga'
   },
   tt: {
     name: 'Tatar',
     nativeName: 'Татарча, tatarça, تاتارچا‎'
   },
   tw: {
     name: 'Twi',
     nativeName: 'Twi'
   },
   ty: {
     name: 'Tahitian',
     nativeName: 'Reo Tahiti'
   },
   ug: {
     name: 'Uighur, Uyghur',
     nativeName: 'Uyƣurqə, ئۇيغۇرچە‎'
   },
   uk: {
     name: 'Ukrainian',
     nativeName: 'Українська'
   },
   ur: {
     name: 'Urdu',
     nativeName: 'اردو'
   },
   uz: {
     name: 'Uzbek',
     nativeName: 'Zbek, Ўзбек, أۇزبېك‎'
   },
   ve: {
     name: 'Venda',
     nativeName: 'Tshivenḓa'
   },
   vi: {
     name: 'Vietnamese',
     nativeName: 'Tiếng Việt'
   },
   vo: {
     name: 'Volapük',
     nativeName: 'Volapük'
   },
   wa: {
     name: 'Walloon',
     nativeName: 'Walon'
   },
   cy: {
     name: 'Welsh',
     nativeName: 'Cymraeg'
   },
   wo: {
     name: 'Wolof',
     nativeName: 'Wollof'
   },
   fy: {
     name: 'Western Frisian',
     nativeName: 'Frysk'
   },
   xh: {
     name: 'Xhosa',
     nativeName: 'IsiXhosa'
   },
   yi: {
     name: 'Yiddish',
     nativeName: 'ייִדיש'
   },
   yo: {
     name: 'Yoruba',
     nativeName: 'Yorùbá'
   },
   za: {
     name: 'Zhuang, Chuang',
     nativeName: 'Saɯ cueŋƅ, Saw cuengh'
   }
 };

 /**
  * Takes an array of languages and removes specifiers for a language,
  * if that language is the only one we have.
  *
  * @export
  * @param {Array<Language>} languages
  */
 export function removeUnneccessaryRegions(input: Array<Language>) {
   const rgx = /(\S*) \(\w*\)/;
   const languageNames: StringMap<Array<Language>> = { noPrefix: [] };
   const output: Array<Language> = [];

   input.forEach((lang) => {
     const match = lang.label.match(rgx);

     if (match && match.length === 2) {
       languageNames[match[1]] = languageNames[match[1]] || [];
       languageNames[match[1]].push(lang);
     } else {
       languageNames.noPrefix.push(lang);
     }
   });

   Object.keys(languageNames).forEach((bucket) => {
     if (bucket === 'noPrefix' || languageNames[bucket].length > 1) {
       output.push(...languageNames[bucket]);
     } else {
       output.push(...languageNames[bucket].map((lang) => {
         lang.label = lang.nativeName;
         return lang;
       }));
     }
   });

   return output.sort((a, b) => a.label >= b.label ? 1 : -1);
 }

 /**
  * Get's a language name and native name for a given
  * ISO-639-1 key.
  *
  * Ported over from Ghost Desktop (https://raw.githubusercontent.com/TryGhost/Ghost-Desktop/master/app/utils/iso639.js)
  *
  * @export
  * @param key - Key of the language (ie "de")
  * @returns - Language object
  */
 export function getLanguageNames(key: string, options: GetLanguageNamesOptions = { includeEnglishNames: true }) {
   const { includeEnglishNames } = options;

   let language: Language | null = null;
   const slicedKey = key.slice(0, 2);

   if (languages[key]) {
     language = { ...languages[key], key, label: getLabel(languages[key], includeEnglishNames) };
   } else if (languages[slicedKey]) {
     // Fallback: Maybe this is a sublocale (like en_GB)
     const sublocale = key.slice(key.length - 2);
     language = { ...languages[slicedKey], key, label: getLabel(languages[slicedKey], includeEnglishNames, sublocale) };
   } else {
     // Fallback: We have no idea what this is
     language = { label: key, name: key, nativeName: key, key };
   }

   return language;
 }

 /**
  * Returns a pretty label for an ISO-639 language and a possible sub-string
  *
  * @param {Iso639Language} lang
  * @param {string} sub
  * @returns {string}
  */
 function getLabel(lang: Iso639Language, includeEnglishNames: boolean = true, sub?: string): string {
   if (lang.name === lang.nativeName) {
     if (sub) {
       return `${lang.name} (${sub})`;
     } else {
       return lang.name;
     }
   } else if (includeEnglishNames === false) {
     if (sub) {
       return `${lang.nativeName} (${sub})`;
     } else {
       return `${lang.nativeName}`;
     }
   } else {
     if (sub) {
       return `${lang.name} (${sub}) | ${lang.nativeName} (${sub})`;
     } else {
       return `${lang.name} | ${lang.nativeName}`;
     }
   }
 }

