import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3/client";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
): Promise<Response> {
  const { key: parts } = await params;
  const key = parts.join("/");

  // Solo se pueden leer fotos de la carpeta fotos/
  if (!key.startsWith("fotos/") || key.includes("..")) {
    return new Response("No encontrado", { status: 404 });
  }

  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    return new Response("Error de configuración", { status: 500 });
  }

  try {
    const result = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    if (!result.Body) {
      return new Response("No encontrado", { status: 404 });
    }

    return new Response(result.Body.transformToWebStream(), {
      headers: {
        "Content-Type": result.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error leyendo de S3:", error);
    return new Response("No encontrado", { status: 404 });
  }
}