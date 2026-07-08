import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toRelative(url: string | null): string | null {
  if (!url) return url;
  if (!url.includes("://")) return url; // already relative
  try {
    const parsed = new URL(url);
    return parsed.pathname; // strips protocol + host, keeps e.g. /uploads/filename.pdf
  } catch {
    return url; // leave untouched if it doesn't parse as a URL
  }
}

async function main() {
  console.log("Scanning solutions...");
  const solutions = await prisma.solution.findMany();
  let solutionsUpdated = 0;

  for (const s of solutions) {
    const newIcon = toRelative(s.iconUrl);
    const newThumb = toRelative(s.thumbnailUrl);
    if (newIcon !== s.iconUrl || newThumb !== s.thumbnailUrl) {
      await prisma.solution.update({
        where: { id: s.id },
        data: { iconUrl: newIcon, thumbnailUrl: newThumb },
      });
      console.log(`  Updated solution "${s.title}"`);
      solutionsUpdated++;
    }
  }

  console.log("\nScanning collaterals...");
  const collaterals = await prisma.collateral.findMany();
  let collateralsUpdated = 0;

  for (const c of collaterals) {
    const newFile = toRelative(c.fileUrl);
    if (newFile !== c.fileUrl && newFile) {
      await prisma.collateral.update({
        where: { id: c.id },
        data: { fileUrl: newFile },
      });
      console.log(`  Updated collateral "${c.title}"`);
      collateralsUpdated++;
    }
  }

  console.log(`\nDone. Solutions updated: ${solutionsUpdated}, Collaterals updated: ${collateralsUpdated}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());