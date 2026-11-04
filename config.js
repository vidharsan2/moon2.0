/* ------------------------------------------------------------------
   EDIT THIS FILE. Every page reads everything from here.
   ------------------------------------------------------------------ */
window.CAPSULE = {
  // Her name as it appears on the main page
  friendName: "Kannuhh",

  // Your name, shown at the end of the letter.
  fromName: "Vishooow",

  // The PIN she needs to open the site. Digits only, any length.
  // Only YOU should know this — tell her separately (in person, a text, etc).
  pin: "0906",

  // Text on the lock page. Change these if you want, or leave as is.
  pinTitle: "This one needs a PIN",
  pinHint: "Only one person knows it. Ask them.",
  // Small line above the title on the lock page ("" to hide it)
  pinEyebrow: "The moon whispered a number",

  // Optional: your own ambient music for the moon + lock pages (e.g. "ambient.mp3").
  // Leave "" to use the soft night music that the site generates by itself.
  ambientMusic: "",

  // One line under her name on the main page
  lede: "Look up for a second. Tonight's sky is yours.",

  // The letter. One string per paragraph. Edit freely.
  // Wrap any phrase in **double stars** and it gets highlighted on the page.
  letter: [
    "Happy birthday. I tried a lot of ways to say what I wanted to say, and in the end the **night sky was the closest I could get to it**.",
    "Most people pass through your life like street lights. Bright for a moment, easy to forget once you turn the corner. **You are not like that.** You are more like the stars: there before I noticed you, steady when everything else goes dark, and **the one thing I can always find when I look up**.",
    "You make ordinary days feel like they matter. You laugh in a way that lightens a whole room, you listen even when it's inconvenient, and you care about people without keeping score. I don't think you know how much of yourself you give away, so let me say it plainly: **it is noticed, and it means more than you think**.",
    "I hope this year is kind to you. I hope the good things arrive right on time, the hard things pass quickly, and the people who love you say it out loud more often than they do now. And on the days you forget how far you've come, remember that **the sky never asks you to be more than you already are**.",
    "**Thank you for being my friend.** Rare things are hard to come by, and you are one of them, the kind of bright thing people wait years to see. **I'm lucky I was looking up when you came along.**",
    "Happy birthday, {name}. Go on, make a wish.",
  ],

  // Written just above your name at the end of the letter
  signOff: "With all my love,",

  // Text above the wish button
  wishLine: "Every good night sky has a shooting star.",

  // Photos shown in a gallery under the letter.
  // Put the photo files in the SAME FOLDER as index.html / main.html / config.js,
  // then list their exact file names here (case matters). Add or remove lines freely.
  // caption is optional - leave it as "" if you don't want text under a photo.
  photos: [
    { src: "photo1.jpg", caption: "🦋🌼" },
    { src: "photo2.jpg", caption: "❤️" },
    { src: "photo3.jpg", caption: "😽" },
  ],

  // Song that plays once she enters the PIN and this page opens.
  // Put the audio file in the same folder and set its exact file name here.
  // Leave it as "" (empty) if you don't want a song.
  song: "song.mp3",
};
