import fs from 'node:fs'

const DEV_MODE = typeof process.env.DEV_MODE !== 'undefined';

const isDocker0 = () => {
  if (!DEV_MODE) {
    console.log('Dev mode not enabled, skipping docker check')
    return false;
  }
  const isDocker = fs.existsSync('/.dockerenv')
  if (isDocker) {
    console.log('Running in Docker, using fake encrypted connection string')
  } else {
    console.log('Checked for Docker, but not found, using real encrypted connection string')
  }
  return isDocker;
}

const isInDocker = isDocker0();

export function isDocker() {
  return isInDocker;
}
