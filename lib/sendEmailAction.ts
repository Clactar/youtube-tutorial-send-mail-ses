"use server";

import crypto from "crypto";
import { z } from "zod";

// Define the email data structure
const emailSchema = z
  .object({
    from: z.string().email(),
    to: z.string().email(),
    subject: z.string(),
    html: z.string().optional(),
    text: z.string().optional(),
  })
  .refine((data) => data.html || data.text, {
    message: "Either 'html' or 'text' must be provided",
  });

type EmailData = z.infer<typeof emailSchema>;

// AWS Signature V4 helper functions
function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
) {
  const kDate = crypto
    .createHmac("sha256", "AWS4" + key)
    .update(dateStamp)
    .digest();
  const kRegion = crypto
    .createHmac("sha256", kDate)
    .update(regionName)
    .digest();
  const kService = crypto
    .createHmac("sha256", kRegion)
    .update(serviceName)
    .digest();
  const kSigning = crypto
    .createHmac("sha256", kService)
    .update("aws4_request")
    .digest();
  return kSigning;
}

function getAmzDate() {
  return new Date()
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, "")
    .slice(0, 16);
}

export async function sendEmail(data: EmailData) {
  try {
    // Strict array check

    const validatedData = emailSchema.parse(data);

    const body = JSON.stringify(validatedData);

    // AWS Auth parameters
    const accessKey = process.env.IAM_ACCESS_KEY_ID!;
    const secretKey = process.env.IAM_SECRET_ACCESS_KEY!;
    const region = "eu-west-3";
    const service = "execute-api";
    const host = "2nzclnil3a.execute-api.eu-west-3.amazonaws.com";
    const endpoint = "/dev";

    const amzDate = getAmzDate();
    const dateStamp = amzDate.slice(0, 8);
    const contentHash = crypto.createHash("sha256").update(body).digest("hex");

    // Create canonical request
    const canonicalHeaders = [
      `content-length:${Buffer.byteLength(body)}`,
      `content-type:application/json`,
      `host:${host}`,
      `x-amz-content-sha256:${contentHash}`,
      `x-amz-date:${amzDate}`,
    ].join("\n");

    const signedHeaders =
      "content-length;content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = [
      "POST",
      endpoint,
      "",
      canonicalHeaders,
      "",
      signedHeaders,
      contentHash,
    ].join("\n");

    // Create string to sign
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");

    // Calculate signature
    const signingKey = getSignatureKey(secretKey, dateStamp, region, service);
    const signature = crypto
      .createHmac("sha256", signingKey)
      .update(stringToSign)
      .digest("hex");

    // Create authorization header
    const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`https://${host}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Amz-Date": amzDate,
        "X-Amz-Content-Sha256": contentHash,
        Authorization: authorization,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
