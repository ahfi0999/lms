/*
  Warnings:

  - You are about to drop the column `userId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `contentDir` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CourseToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "_CourseToUser" DROP CONSTRAINT "_CourseToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_CourseToUser" DROP CONSTRAINT "_CourseToUser_B_fkey";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "userId",
ADD COLUMN     "user" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "contentDir",
ADD COLUMN     "contentLink" TEXT,
ADD COLUMN     "users" TEXT[];

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "_CourseToUser";

-- DropEnum
DROP TYPE "Role";
