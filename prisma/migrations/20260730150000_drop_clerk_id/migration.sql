-- Fin de la migration Clerk → better-auth : la colonne héritée n'est plus lue
-- par aucun code déployé. L'index unique associé tombe avec la colonne.

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clerkId";
