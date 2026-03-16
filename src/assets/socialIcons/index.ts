import instagram from './instagram.png';
import twitter from './twitter.png';
import tiktok from './tiktok.png';
import youtube from './youtube.png';
import linkedin from './linkedin.png';
import twitch from './twitch.png';
import discord from './discord.png';
import telegram from './telegram.png';
import threads from './threads.png';

export const socialIcons = {
    instagram,
    twitter,
    tiktok,
    youtube,
    linkedin,
    twitch,
    discord,
    telegram,
    threads,
};

export type SocialPlatformId = keyof typeof socialIcons;
