import type { Quiz } from '@ryzzquizz/shared';
import { flagUrl, funQuiz, q, qi } from './build.js';

// ទាយប្រទេស · ទាយតារា — the guessing shelves.

// No real photos of real people — no image-fetch capability, and portrait
// rights/copyright make random hotlinking a bad idea. These photos are the
// one safe exception: every URL is the exact "thumbnail.source" returned by
// Wikipedia's public REST API (GET /api/rest_v1/page/summary/<title>) for
// that person, filtered to only /wikipedia/commons/ paths — Commons requires
// every file to be freely licensed (CC/PD), unlike a same-named
// /wikipedia/<lang>/ path which can be fair-use-only and isn't safe to reuse
// here. Nothing below is a guessed or fabricated URL. Questions this
// couldn't be verified for keep a themed icon instead of a fake photo.
const WORLD_PHOTOS = {
  madonna: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MadonnaO2171023_%2897_of_133%29_%2853269593787%29_%28cropped%29.jpg/330px-MadonnaO2171023_%2897_of_133%29_%2853269593787%29_%28cropped%29.jpg',
  rdj: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/RobertDowneyJr-byPhilipRomano7_%28cropped%29.jpg/330px-RobertDowneyJr-byPhilipRomano7_%28cropped%29.jpg',
  ronaldo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg/330px-Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg',
  musk: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/330px-Elon_Musk_-_54820081119_%28cropped%29.jpg',
  rihanna: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rihanna_Fenty_2018.png/330px-Rihanna_Fenty_2018.png',
  dicaprio: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/LeoPTABFI191125-28_%28cropped%29.jpg/330px-LeoPTABFI191125-28_%28cropped%29.jpg',
  swift: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/330px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
  mj: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/330px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg',
  zuck: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/F20250904AH-2824_%2854778373111%29_%283x4_cropped_on_Zuckerberg_following_the_rule_of_thirds%29.jpg/330px-F20250904AH-2824_%2854778373111%29_%283x4_cropped_on_Zuckerberg_following_the_rule_of_thirds%29.jpg',
  watson: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Emma_Watson_2013.jpg/330px-Emma_Watson_2013.jpg',
  lebron: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/LeBron_James_%2851959977144%29_%28cropped2%29.jpg/330px-LeBron_James_%2851959977144%29_%28cropped2%29.jpg',
  rowling: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/J._K._Rowling_2010.jpg/330px-J._K._Rowling_2010.jpg',
  davinci: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Francesco_Melzi_-_Portrait_of_Leonardo.png/330px-Francesco_Melzi_-_Portrait_of_Leonardo.png',
  einstein: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Albert_Einstein_Head_cleaned.jpg/330px-Albert_Einstein_Head_cleaned.jpg',
  sheeran: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Ed_Sheeran-6886_%28cropped_2%29.jpg/330px-Ed_Sheeran-6886_%28cropped_2%29.jpg',
  armstrong: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Neil_Armstrong_pose.jpg/330px-Neil_Armstrong_pose.jpg',
  messi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg/330px-Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg',
  beyonce: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg/330px-Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg',
} as const;

// Same rule as above — real Commons photos only where the Wikipedia API
// actually returned one; Ros Serey Sothea's only photo on Wikipedia is
// fair-use (path is /wikipedia/en/, not /wikipedia/commons/), so her
// question keeps its icon rather than reusing a non-free image.
const KHMER_PHOTOS = {
  sisamouth: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Sinn_Sisamouth_%28cropped%29.jpg',
  vannda: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Vannda1%E2%80%9909%E2%80%9D_%28cropped%29.jpg/330px-Vannda1%E2%80%9909%E2%80%9D_%28cropped%29.jpg',
  kongnay: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Kong_Nay.jpg/330px-Kong_Nay.jpg',
  sihanouk: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Norodom_Sihanouk_in_1941.jpg/330px-Norodom_Sihanouk_in_1941.jpg',
  rithypanh: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Rithy_Panh-3681.jpg/330px-Rithy_Panh-3681.jpg',
  meassoksophea: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Meas_Soksophea.jpg/330px-Meas_Soksophea.jpg',
  vannmolyvann: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Vann_Molyvann.jpg/330px-Vann_Molyvann.jpg',
  preapsovath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Preap_Sovath_at_the_4th_Kep_Trade_Fair_Concert_on_December_27_2011.JPG/330px-Preap_Sovath_at_the_4th_Kep_Trade_Fair_Concert_on_December_27_2011.JPG',
  chuonnath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Jhota%C3%B1ano_Chuon_Nath_%E1%9E%87%E1%9E%BD%E1%9E%93%E1%9E%8E%E1%9E%B6%E1%9E%8F_1961.jpg/330px-Jhota%C3%B1ano_Chuon_Nath_%E1%9E%87%E1%9E%BD%E1%9E%93%E1%9E%8E%E1%9E%B6%E1%9E%8F_1961.jpg',
} as const;

export const GUESS_QUIZZES: Quiz[] = [
  funQuiz('guess-flags', 'ទាយទង់ជាតិ', 'Country Guess · Flags', 'geography', '🏳️', [
    qi('Which country is this?', flagUrl('kh'), ['Cambodia', 'Myanmar', 'Laos', 'Vietnam'], 0),
    qi('Which country is this?', flagUrl('jp'), ['China', 'Japan', 'South Korea', 'Bangladesh'], 1),
    qi('Which country is this?', flagUrl('br'), ['Argentina', 'Portugal', 'Brazil', 'Colombia'], 2),
    qi('Which country is this?', flagUrl('ca'), ['Canada', 'Denmark', 'Switzerland', 'Austria'], 0),
    qi('Which country is this?', flagUrl('kr'), ['North Korea', 'South Korea', 'Japan', 'Taiwan'], 1),
    qi('Which country is this?', flagUrl('sg'), ['Indonesia', 'Poland', 'Singapore', 'Monaco'], 2),
    qi('Which country is this?', flagUrl('de'), ['Belgium', 'Germany', 'Netherlands', 'Austria'], 1),
    qi('Which country is this?', flagUrl('au'), ['New Zealand', 'United Kingdom', 'Australia', 'Fiji'], 2),
    qi('Which country is this?', flagUrl('vn'), ['China', 'Vietnam', 'Morocco', 'Turkey'], 1),
    qi('Which country is this?', flagUrl('mn'), ['Mongolia', 'Kazakhstan', 'Nepal', 'Bhutan'], 0),
    qi('Which country is this?', flagUrl('la'), ['Laos', 'Cambodia', 'Myanmar', 'Bangladesh'], 0),
    qi('Which country is this?', flagUrl('in'), ['Ireland', 'India', 'Niger', 'Italy'], 1),
    qi('Which country is this?', flagUrl('fr'), ['Netherlands', 'Russia', 'France', 'Luxembourg'], 2),
    qi('Which country is this?', flagUrl('us'), ['Liberia', 'Malaysia', 'Chile', 'United States'], 3),
    qi('Which country is this?', flagUrl('gb'), ['United Kingdom', 'Australia', 'New Zealand', 'Norway'], 0),
    qi('Which country is this?', flagUrl('my'), ['Indonesia', 'Malaysia', 'Philippines', 'Brunei'], 1),
    qi('Which country is this?', flagUrl('cn'), ['Vietnam', 'Turkey', 'China', 'Tunisia'], 2),
    qi('Which country is this?', flagUrl('ph'), ['Indonesia', 'Brunei', 'Myanmar', 'Philippines'], 3),
  ], 15, 'easy'),

  funQuiz('guess-capitals', 'ទាយរាជធានី', 'Country Guess · Capital Cities', 'geography', '🏙️', [
    q('What is the capital of Cambodia?', ['Siem Reap', 'Phnom Penh', 'Battambang', 'Sihanoukville'], 1),
    q('What is the capital of Japan?', ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya'], 0),
    q('What is the capital of Australia?', ['Sydney', 'Melbourne', 'Canberra', 'Perth'], 2),
    q('What is the capital of Canada?', ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'], 1),
    q('What is the capital of Vietnam?', ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hue'], 1),
    q('What is the capital of Türkiye?', ['Ankara', 'Istanbul', 'Izmir', 'Bursa'], 0),
    q('What is the capital of Brazil?', ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], 2),
    q('What is the capital of Switzerland?', ['Bern', 'Zurich', 'Geneva', 'Basel'], 0),
    q('What is the capital of Laos?', ['Luang Prabang', 'Vientiane', 'Pakse', 'Savannakhet'], 1),
    q('What is the capital of Myanmar?', ['Yangon', 'Mandalay', 'Naypyidaw', 'Bagan'], 2),
    q('What is the capital of Indonesia?', ['Jakarta', 'Bali', 'Surabaya', 'Bandung'], 0),
    q('What is the capital of South Korea?', ['Busan', 'Seoul', 'Incheon', 'Daegu'], 1),
    q('What is the capital of India?', ['Mumbai', 'Kolkata', 'New Delhi', 'Chennai'], 2),
    q('What is the capital of Egypt?', ['Alexandria', 'Cairo', 'Giza', 'Luxor'], 1),
    q('What is the capital of Spain?', ['Barcelona', 'Valencia', 'Seville', 'Madrid'], 3),
    q('What is the capital of New Zealand?', ['Auckland', 'Wellington', 'Christchurch', 'Dunedin'], 1),
    q('What is the capital of the Philippines?', ['Cebu', 'Davao', 'Manila', 'Quezon'], 2),
    q('What is the capital of Malaysia?', ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Malacca'], 0),
  ], 15, 'medium'),

  funQuiz('guess-landmarks', 'ទាយស្ថានីយល្បី', 'Country Guess · Famous Landmarks', 'geography', '🗿', [
    qi('In which country is Angkor Wat?', '🛕', ['Vietnam', 'Cambodia', 'Laos', 'Myanmar'], 1),
    qi('The Eiffel Tower is in which city?', '🗼', ['Paris', 'Rome', 'Madrid', 'Berlin'], 0),
    q('The Great Wall is in which country?', ['Japan', 'Mongolia', 'China', 'Korea'], 2),
    qi('Machu Picchu is in which country?', '⛰️', ['Peru', 'Mexico', 'Chile', 'Bolivia'], 0),
    qi('The Taj Mahal is in which country?', '🕌', ['Pakistan', 'Bangladesh', 'India', 'Nepal'], 2),
    qi('The Colosseum is in which city?', '🏛️', ['Athens', 'Rome', 'Naples', 'Milan'], 1),
    q('Christ the Redeemer overlooks which city?', ['Buenos Aires', 'Lima', 'Rio de Janeiro', 'Bogotá'], 2),
    q('The Pyramids of Giza are in which country?', ['Sudan', 'Egypt', 'Libya', 'Morocco'], 1),
    qi('The Statue of Liberty is in which city?', '🗽', ['Boston', 'New York', 'Washington DC', 'Chicago'], 1),
    q('Big Ben is in which city?', ['Dublin', 'Edinburgh', 'London', 'Manchester'], 2),
    q('The Sydney Opera House is in which country?', ['New Zealand', 'Australia', 'Fiji', 'Canada'], 1),
    qi('Mount Fuji is in which country?', '🗻', ['China', 'Korea', 'Japan', 'Taiwan'], 2),
    q('Petra is an ancient city in which country?', ['Jordan', 'Israel', 'Syria', 'Iraq'], 0),
    q('The Leaning Tower is in which Italian city?', ['Florence', 'Pisa', 'Venice', 'Turin'], 1),
    qi('Bayon temple with its stone faces is part of which complex?', '🛕', ['Angkor Thom', 'Preah Vihear', 'Banteay Srei', 'Sambor Prei Kuk'], 0),
    qi('The Burj Khalifa is in which city?', '🏙️', ['Doha', 'Abu Dhabi', 'Dubai', 'Riyadh'], 2),
    qi('Stonehenge is located in which country?', '🪨', ['Ireland', 'Scotland', 'England', 'Wales'], 2),
    qi('The Golden Gate Bridge is in which US city?', '🌉', ['Los Angeles', 'Seattle', 'San Diego', 'San Francisco'], 3),
  ], 15, 'easy'),

  funQuiz('country-facts', 'ការពិតអំពីប្រទេស', 'Country Guess · World Facts', 'geography', '🌐', [
    q('Which currency is used in Cambodia?', ['Kyat', 'Riel', 'Dong', 'Kip'], 1),
    q('Which country has the largest population in the world?', ['India', 'China', 'United States', 'Indonesia'], 0),
    q('Which is the smallest country in the world by area?', ['Monaco', 'Vatican City', 'Nauru', 'San Marino'], 1),
    q('Which country spans the most time zones?', ['Russia', 'United States', 'France', 'China'], 2),
    q('Which language has the most native speakers?', ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], 2),
    q('Which country is known as the Land of the Rising Sun?', ['China', 'Japan', 'Indonesia', 'Korea'], 1),
    q('Which continent has the most countries?', ['Asia', 'Africa', 'Europe', 'South America'], 1),
    q('Which of these is a landlocked country (no coastline)?', ['Vietnam', 'Laos', 'Philippines', 'Indonesia'], 1),
    q('Which country has the longest coastline in the world?', ['Russia', 'Canada', 'Australia', 'Indonesia'], 1),
    q('Which currency is used in Japan?', ['Won', 'Yuan', 'Yen', 'Ringgit'], 2),
    q('Which country is made up of the most islands?', ['Indonesia', 'Philippines', 'Sweden', 'Japan'], 2),
    q('Which country is both in Europe and Asia?', ['Greece', 'Türkiye', 'Egypt', 'Italy'], 1),
    q('Which is the highest waterfall in the world?', ['Niagara Falls', 'Victoria Falls', 'Angel Falls', 'Iguazu Falls'], 2),
    q('Which desert is the largest hot desert on Earth?', ['Gobi', 'Sahara', 'Kalahari', 'Atacama'], 1),
    q('Which country invented paper?', ['Egypt', 'Greece', 'China', 'India'], 2),
    q('Which country has a flag that is not rectangular?', ['Nepal', 'Bhutan', 'Sri Lanka', 'Qatar'], 0),
    q('Which sea is the saltiest large body of water?', ['Red Sea', 'Dead Sea', 'Black Sea', 'Caspian Sea'], 1),
    q('Which country hosted the 2024 Summer Olympics?', ['Japan', 'Brazil', 'France', 'United Kingdom'], 2),
  ], 18, 'hard'),

  funQuiz('celeb-world', 'ទាយតារាល្បីពិភពលោក', 'Celebrity Guess · World Stars', 'people', '⭐', [
    qi('Who is this singer, known as the "Queen of Pop"?', WORLD_PHOTOS.madonna, ['Madonna', 'Beyoncé', 'Rihanna', 'Adele'], 0),
    qi('Who is this actor, who played Iron Man in the Marvel films?', WORLD_PHOTOS.rdj, ['Robert Downey Jr.', 'Chris Evans', 'Chris Hemsworth', 'Mark Ruffalo'], 0),
    qi('Who is this footballer, nicknamed "CR7"?', WORLD_PHOTOS.ronaldo, ['Cristiano Ronaldo', 'Lionel Messi', 'Neymar', 'Kylian Mbappé'], 0),
    qi('Who is this entrepreneur, founder of SpaceX and CEO of Tesla?', WORLD_PHOTOS.musk, ['Elon Musk', 'Jeff Bezos', 'Bill Gates', 'Mark Zuckerberg'], 0),
    qi('Who is this singer?', WORLD_PHOTOS.rihanna, ['Rihanna', 'Beyoncé', 'Adele', 'Madonna'], 0),
    qi('Who is this actor, who starred in "Titanic"?', WORLD_PHOTOS.dicaprio, ['Leonardo DiCaprio', 'Brad Pitt', 'Tom Cruise', 'Johnny Depp'], 0),
    qi('Who is this singer, known for the album "1989"?', WORLD_PHOTOS.swift, ['Taylor Swift', 'Katy Perry', 'Lady Gaga', 'Ariana Grande'], 0),
    qi('Who is this singer, known as the "King of Pop"?', WORLD_PHOTOS.mj, ['Michael Jackson', 'Elvis Presley', 'Prince', 'James Brown'], 0),
    qi('Who is this entrepreneur, founder of Facebook?', WORLD_PHOTOS.zuck, ['Mark Zuckerberg', 'Jack Dorsey', 'Larry Page', 'Evan Spiegel'], 0),
    qi('Who is this actress, known for playing Hermione in the Harry Potter films?', WORLD_PHOTOS.watson, ['Emma Watson', 'Emma Stone', 'Emily Blunt', 'Anne Hathaway'], 0),
    qi('Who is this basketball player, nicknamed "King James"?', WORLD_PHOTOS.lebron, ['LeBron James', 'Kobe Bryant', 'Stephen Curry', 'Michael Jordan'], 0),
    qi('Who is this author, who wrote the Harry Potter book series?', WORLD_PHOTOS.rowling, ['J.K. Rowling', 'J.R.R. Tolkien', 'Suzanne Collins', 'Rick Riordan'], 0),
    qi('Who is this artist, painter of the Mona Lisa?', WORLD_PHOTOS.davinci, ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Van Gogh'], 0),
    qi('Who is this scientist, who proposed the theory of relativity?', WORLD_PHOTOS.einstein, ['Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Galileo'], 0),
    qi('Who is this singer, famous for the song "Shape of You"?', WORLD_PHOTOS.sheeran, ['Ed Sheeran', 'Justin Bieber', 'Sam Smith', 'Shawn Mendes'], 0),
    qi('Who is this astronaut, the first person to walk on the Moon?', WORLD_PHOTOS.armstrong, ['Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'Michael Collins'], 0),
    qi('Who is this footballer, winner of the most Ballon d\'Or awards?', WORLD_PHOTOS.messi, ['Lionel Messi', 'Cristiano Ronaldo', 'Ronaldinho', 'Zinedine Zidane'], 0),
    qi('Who is this singer?', WORLD_PHOTOS.beyonce, ['Beyoncé', 'Rihanna', 'Taylor Swift', 'Adele'], 0),
  ], 18, 'medium'),

  funQuiz('celeb-khmer', 'ទាយតារាខ្មែរ', 'Celebrity Guess · Khmer Stars', 'people', '🎤', [
    qi('តើនរណាជាតារាចម្រៀងខ្មែរនេះ ដែលគេហៅថា «ស្តេចចម្រៀងខ្មែរ»?', KHMER_PHOTOS.sisamouth, ['ស៊ិន ស៊ីសាមុត', 'ព្រាប សុវត្ថិ', 'ខេមរៈ សិរីមន្ត', 'វណ្ណដា'], 0),
    qi('តារាចម្រៀងស្រីល្បីនៃទសវត្សរ៍ ១៩៦០ ដែលច្រៀងគូជាមួយ ស៊ិន ស៊ីសាមុត គឺនរណា?', '🎤', ['សុខ ពិសី', 'រស់ សេរីសុទ្ធា', 'មាស សុខសោភា', 'អោក សុគន្ធកញ្ញា'], 1),
    qi('តើនរណាជាសិល្បករ Rap ខ្មែរនេះ ដែលល្បីជាមួយបទ «Time To Rise»?', KHMER_PHOTOS.vannda, ['វណ្ណដា (VannDa)', 'ខេមរៈ សិរីមន្ត', 'ព្រាប សុវត្ថិ', 'នុប បាយ៉ារិទ្ធ'], 0),
    qi('តើនរណាជាតន្ត្រីករចាប៉ីនេះ ដែលបានសហការក្នុងបទ «Time To Rise»?', KHMER_PHOTOS.kongnay, ['គង់ ណៃ', 'ក្រម ង៉ុយ', 'ព្រាប សុវត្ថិ', 'ស៊ិន ស៊ីសាមុត'], 0),
    qi('តើនរណាជាព្រះមហាក្សត្រកម្ពុជាព្រះអង្គនេះ ដែលធ្លាប់ជាអ្នកដឹកនាំរឿងភាពយន្តដែរ?', KHMER_PHOTOS.sihanouk, ['ព្រះបាទនរោត្តម សីហនុ', 'ព្រះបាទស៊ីសុវត្ថិ', 'ព្រះបាទអង្គដួង', 'ព្រះបាទនរោត្តម សីហមុនី'], 0),
    qi('ភាពយន្ត «First They Killed My Father» ត្រូវបានដឹកនាំដោយនរណា?', '🎬', ['ស្ទីវិន ស្ពីលបឺក', 'រិទ្ធី ប៉ាន់', 'ជេមស៍ ខាមេរ៉ុន', 'អាំងជេលីណា ជូលី'], 3),
    qi('តើនរណាជាអ្នកដឹកនាំភាពយន្តខ្មែរនេះ ដែលបានដឹកនាំរឿង «The Missing Picture»?', KHMER_PHOTOS.rithypanh, ['រិទ្ធី ប៉ាន់', 'ចាន់ ណារ៉ា', 'នុប បាយ៉ារិទ្ធ', 'ស៊ិន ស៊ីសាមុត'], 0),
    qi('តើនរណាជាតារាចម្រៀងខ្មែរស្រីនេះ?', KHMER_PHOTOS.meassoksophea, ['មាស សុខសោភា', 'រស់ សេរីសុទ្ធា', 'អោក សុគន្ធកញ្ញា', 'ប៉ែន រ៉ន'], 0),
    qi('«គង់ ណៃ» ជាមេចាប៉ីដែលគេស្គាល់ក្នុងឋានៈអ្វី?', '🎸', ['អ្នកបង្កើតរបាំ', 'មេចាប៉ីដងវែងដ៏ល្បី', 'អ្នកនិពន្ធវចនានុក្រម', 'ស្ថាបត្យករ'], 1),
    qi('តើនរណាជាស្ថាបត្យករខ្មែរនេះ ដែលបង្កើត «ស្ថាបត្យកម្មខ្មែរថ្មី»?', KHMER_PHOTOS.vannmolyvann, ['វណ្ណ ម៉ូលីវណ្ណ', 'ជួន ណាត', 'នូ ហាច', 'ក្រម ង៉ុយ'], 0),
    qi('តើនរណាជាតារាចម្រៀងខ្មែរនេះ?', KHMER_PHOTOS.preapsovath, ['ព្រាប សុវត្ថិ', 'ខេមរៈ សិរីមន្ត', 'វណ្ណដា', 'នុប បាយ៉ារិទ្ធ'], 0),
    qi('សិល្បករបុរាណខ្មែរ «ក្រម ង៉ុយ» ល្បីខាងអ្វី?', '🎸', ['ការតែងកំណាព្យ និងច្រៀងចាប៉ី', 'ការសាងសង់ប្រាសាទ', 'ការធ្វើភាពយន្ត', 'ការលេងបាល់'], 0),
    qi('សិល្បៈរបាំព្រះរាជទ្រព្យខ្មែរត្រូវបានចុះក្នុងបញ្ជី UNESCO ក្នុងឆ្នាំណា?', '💃', ['២០០៣', '២០១០', '២០១៦', '២០២០'], 0),
    qi('«រស់ សេរីសុទ្ធា» ជាសិល្បការិនីនៃសម័យណា?', '🎤', ['សម័យអង្គរ', 'ទសវត្សរ៍ ១៩៦០–៧០', 'ទសវត្សរ៍ ២០១០', 'សតវត្សរ៍ទី១៩'], 1),
    qi('តារាចម្រៀងខ្មែរណាដែលមានឈ្មោះហៅក្រៅថា «ខេមរៈ»?', '🎤', ['ព្រាប សុវត្ថិ', 'ខេមរៈ សិរីមន្ត', 'នុប បាយ៉ារិទ្ធ', 'វណ្ណដា'], 1),
    qi('អ្នកនិពន្ធខ្មែរ «នូ ហាច» ល្បីដោយស្នាដៃណា?', '📚', ['ផ្កាស្រពោន', 'កុលាបប៉ៃលិន', 'សូផាត', 'ទុំទាវ'], 0),
    qi('អ្នកនិពន្ធខ្មែរ «ញ៉ុក ថែម» ល្បីដោយស្នាដៃណា?', '📚', ['ផ្កាស្រពោន', 'កុលាបប៉ៃលិន', 'សូផាត', 'ទុំទាវ'], 1),
    qi('តើនរណាជាសម្តេចព្រះសង្ឃរាជនេះ ដែលបានចងក្រងវចនានុក្រមខ្មែរ?', KHMER_PHOTOS.chuonnath, ['សម្តេចជួន ណាត', 'ក្រម ង៉ុយ', 'ព្រះស៊ីសុវត្ថិ', 'ប្រាជ្ញ ឈួន'], 0),
  ], 20, 'medium'),
];
