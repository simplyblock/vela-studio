import fs from 'node:fs'


export function isDocker ()  {
  const DEV_MODE = process.env.VELA_PLATFORM_DEV_MODE !== undefined;
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
