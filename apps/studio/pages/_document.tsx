/* eslint-disable @next/next/no-css-tags */
import { BASE_PATH } from 'lib/constants'
import Document, { DocumentContext, Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Workaround for https://github.com/suren-atoyan/monaco-react/issues/272 */}
          <link
            rel="stylesheet"
            type="text/css"
            data-name="vs/editor/editor.main"
            href={
              'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/editor/editor.main.css'
            }
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
