// npm packages
import chalk from 'chalk';
import got from 'got';

// our packages
import config from './config';
import {handleError} from './error';

// convert to human readable file size
const humanFileSize = (bytes) => {
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }
  const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;
  do {
    bytes /= thresh; // eslint-disable-line
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return `${bytes.toFixed(1)} ${units[u]}`;
};

// simplified url loader
const getUrl = async (remoteUrl) => {
  // construct shared request params
  const options = {
    headers: {
      'x-access-token': config.token,
    },
    json: true,
  };
  // try sending request
  const {body} = await got(remoteUrl, options);
  // check for errors
  if (!body) {
    throw new Error('Server returned empty response!');
  }
  return body;
};

export const getImages = async () => {
  // images request url
  const remoteImagesUrl = `${config.endpoint}/api/images`;
  // try sending request
  const images = await getUrl(remoteImagesUrl);
  return images
    .map(img => ({...img, name: img.RepoTags[0]}))
    .filter(img => !img.name.includes('<none>'));
};

export default (yargs) =>
  yargs.command('list', 'list your images on exoframe server', {}, async () => {
    // log header
    console.log(chalk.bold('Getting images and services from:'), config.endpoint);
    console.log();

    try {
      const images = await getImages();
      if (images.length > 0) {
        console.log(chalk.green('Owned images:'));
        images.forEach((image, i) => {
          console.log(chalk.green(`${i + 1})`), image.name);
          console.log(`  ${chalk.bold('Id')}: ${image.Id.split(':')[1].slice(0, 12)}`);
          console.log(`  ${chalk.bold('Size')}: ${humanFileSize(image.Size)}`);
          console.log(`  ${chalk.bold('Template')}: ${image.Labels['exoframe.type']}`);
        });
      } else {
        console.log(chalk.green('No owned images found!'));
      }
      console.log();

      // services request url
      const remoteSvcUrl = `${config.endpoint}/api/services`;
      // try sending request
      const services = await getUrl(remoteSvcUrl);
      if (services.length > 0) {
        console.log(chalk.green('Owned services:'));
        services.forEach((svc, i) => {
          console.log(chalk.bold(`${i + 1})`), svc.Names[0], ':');
          console.log(`  ${chalk.bold('Image')}: ${svc.Image}`);
          console.log(`  ${chalk.bold('Ports')}: ${svc.Ports.length ? svc.Ports : 'None'}`);
          console.log(`  ${chalk.bold('Status')}: ${svc.Status}`);
          console.log(`  ${chalk.bold('Template')}: ${svc.Labels['exoframe.type']}`);
          console.log();
        });
      } else {
        console.log(chalk.green('No owned services found!'));
      }
    } catch (e) {
      // try generic error handling first
      if (handleError(e)) {
        return;
      }

      // output error message and log error
      console.log(chalk.red('Error getting images or services!'));
      console.error(e);
    }
  });
