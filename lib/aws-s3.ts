import { S3Client } from "@aws-sdk/client-s3"

// Validate AWS environment variables
function validateAWSConfig() {
  const required = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET: process.env.AWS_BUCKET,
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
  }

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required AWS environment variables: ${missing.join(", ")}`)
  }

  return required as Record<string, string>
}

// Create S3 client with explicit configuration
export function createS3Client() {
  const config = validateAWSConfig()

  return new S3Client({
    region: config.AWS_DEFAULT_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: process.env.AWS_USE_PATH_STYLE_ENDPOINT === "true",
  })
}

export const AWS_CONFIG = {
  get region() {
    return process.env.AWS_DEFAULT_REGION || "us-east-2"
  },
  get bucket() {
    return process.env.AWS_BUCKET || "flimsabucket"
  },
  get accessKeyId() {
    return process.env.AWS_ACCESS_KEY_ID!
  },
  get secretAccessKey() {
    return process.env.AWS_SECRET_ACCESS_KEY!
  },
  get usePathStyle() {
    return process.env.AWS_USE_PATH_STYLE_ENDPOINT === "true"
  },
}

export function getS3FileUrl(key: string): string {
  const { region, bucket } = AWS_CONFIG
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

export function parseS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname.substring(1) // Remove leading slash
  } catch {
    return null
  }
}
