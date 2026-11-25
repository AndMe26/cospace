import { NextResponse } from "next/server";
import { subirFoto } from "@/lib/s3/upload";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";

const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const payload = await verifyAccessToken(accessToken);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }



  const formData = await request.formData();
  const foto = formData.get("foto");

  if (!(foto instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo 'foto'" }, { status: 400 });
  }

  const extension = TIPOS[foto.type];
  if (!extension) {
    return NextResponse.json({ error: "Solo JPG, PNG o WEBP" }, { status: 400 });
  }

  if (foto.size > MAX_BYTES) {
    return NextResponse.json({ error: "Máximo 5 MB" }, { status: 413 });
  }

  try {
    const body = Buffer.from(await foto.arrayBuffer());
    const key = await subirFoto({ body, contentType: foto.type, extension });
    return NextResponse.json(
      { key, url: `/api/imagenes/${key}` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subiendo a S3:", error);
    return NextResponse.json({ error: "No se pudo subir la foto" }, { status: 500 });
  }
}