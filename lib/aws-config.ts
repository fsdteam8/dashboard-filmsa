// AWS Configuration utilities

export const AWS_CONFIG = {
  region: process.env.AWS_DEFAULT_REGION || "us-east-2",
  bucket: process.env.AWS_BUCKET || "flimsabucket",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  usePathStyle: process.env.AWS_USE_PATH_STYLE_ENDPOINT === "true",
}

export function validateAWSConfig() {
  const required = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET"]
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required AWS environment variables: ${missing.join(", ")}`)
  }
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
