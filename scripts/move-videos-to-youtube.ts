// @ts-nocheck
// TODO: This file is not being used, WIP.
// Script to take vimeo URL and upload the video to youtube
import { google } from 'googleapis';
import fs from 'fs';
import { db } from '../common/db';
import path from 'path';
import express from 'express';
import axios from 'axios';
import { Vimeo } from 'vimeo';

const vimeo = new Vimeo('random_key', 'random_key', 'random_key');

const credentials = {
  web: {
    client_id: 'random_key.apps.googleusercontent.com',
    project_id: 'project_id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_secret: 'client_secret',
    redirect_uris: ['http://localhost:8081/google'],
  },
};

const app = express();

app.get('/google', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code as string);
  console.log('🚀 ~ file: move-videos-to-youtube.ts:35 ~ app.get ~ tokens:', tokens);
  oauth2Client.setCredentials(tokens);

  main()
    .then(() => {
      console.log('Done!');
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });

  res.send('Done!');
});

app.listen(8081);

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
];

// Get access token using oauth2Client
const oauth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

const url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',

  // If you only need one scope you can pass it as a string
  scope: scopes,
});

console.log(url);

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
});

async function main() {
  const topics = await db.topic.findMany({
    where: {
      videoLink: {
        contains: 'vimeo',
      },
      modulesId: {
        not: null,
      },
    },
  });

  console.log('topics.length', topics.length);

  const promises = topics.map(async (topic) => {
    console.log('Uploading video for topic: ', topic.title);
    let res;
    try {
      res = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: topic.title,
            description: topic.title,
          },
          status: {
            privacyStatus: 'unlisted',
          },
        },
        media: {
          body: await getVimeoVideoStream(topic.videoLink),
        },
      });
      await db.topic.update({
        where: {
          id: topic.id,
        },
        data: {
          videoLink: res.data.id,
        },
      });
    } catch (error) {
      console.error(error);
      console.log('Error uploading video for topic: ', topic.title, topic.id);
    }
    console.log('Done uploading video for topic: ', topic.title, res?.data.id);
  });

  await Promise.all(promises);
  console.log('Done!');
}
async function getVimeoVideoStream(videoLink: string | null) {
  const videoId = videoLink?.split('/').pop();
  return new Promise((resolve, reject) => {
    vimeo.request(
      {
        method: 'GET',
        path: `/videos/${videoId}`,
      },
      (error, body, status_code, headers) => {
        const link = body?.files?.find((file: any) => file.quality === 'hd')?.link;
        if (!link) {
          reject('No link found');
          return;
        }
        if (error) {
          reject(error);
        } else {
          axios
            .get(link, {
              responseType: 'stream',
            })
            .then((res) => {
              resolve(res.data);
            });
        }
      }
    );
  });
}
