import { BASE_PATH } from 'lib/constants'
import GitHubSection from './GithubIntegration/GithubSection'

export const IntegrationImageHandler = ({ title }: { title: 'vercel' | 'github' }) => {
  return (
    <img
      className="border rounded-lg shadow w-full sm:w-48 mt-6 border-body"
      src={`${BASE_PATH}/img/integrations/covers/${title}-cover.png`}
      alt={`${title} cover`}
    />
  )
}

const IntegrationSettings = () => {
  return <GitHubSection />
}

export default IntegrationSettings
