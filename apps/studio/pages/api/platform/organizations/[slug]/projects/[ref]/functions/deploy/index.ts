import { apiBuilder } from "lib/api/apiBuilder"
import { NextApiRequest, NextApiResponse } from "next"

// FIXME: Implementation missing
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    metadata: {
      entrypoint_path: '',
      name: '',
      verify_jwt: false,
    },
    files: [
      {
        name: '',
        content: '', 
      },
    ],
  })
}


const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler