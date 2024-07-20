/* eslint-disable prettier/prettier */
const request = require('request');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_REGION,
  BUCKET_NAME,
} = process.env;

const s3Client = new S3Client({
  region: S3_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    request({ url, encoding: null }, async (err, res, body) => {
      if (err) {
        console.log('Failed to download image:', err);
        return reject(err);
      }
      try {
        const mainImageCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `placeImg/${filename}`,
          Body: body,
          ContentType: res.headers['content-type'],
        });
        await s3Client.send(mainImageCommand);
        console.log('Image successfully uploaded to S3.');
        resolve();
      } catch (uploadErr) {
        console.log('Failed to upload image to S3:', uploadErr);
        reject(uploadErr);
      }
    });
  });
}

module.exports = { downloadImage };
