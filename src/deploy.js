// npm packages
import chalk from 'chalk';
import got from 'got';

// our packages
import config from './config';

export default (yargs) =>
  yargs.command('deploy <image>', 'deploy image on exoframe server', {}, async ({image}) => {
    console.log(chalk.bold('Deploying:'), image, 'on', config.endpoint);
    const options = {
      headers: {
        'x-access-token': config.token,
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        services: [{name: image}],
      }),
      json: true,
    };
    const remoteUrl = `${config.endpoint}/api/deploy`;
    try {
      const {body} = await got.post(remoteUrl, options);
      // check for errors
      if (!body || !body.length) {
        throw new Error('Error deploying!');
      }
      console.log(chalk.green('Successfully deployed!'));
      body.forEach((container, i) => {
        console.log(chalk.bold(`${i + 1})`), 'Container with ID:', container.id);
      });
    } catch (e) {
      console.error(e);
      console.log(chalk.red('Error deploying!'));
    }
  });
