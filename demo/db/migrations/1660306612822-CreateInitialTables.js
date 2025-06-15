"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInitialTables1660306612822 = void 0;
class CreateInitialTables1660306612822 {
    constructor() {
        this.name = 'CreateInitialTables1660306612822';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "Industry" ("id" SERIAL NOT NULL, "industryName" character varying NOT NULL, CONSTRAINT "PK_63f1b157e1b38646de8686ffb85" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "EntityUnit" ("entityUnitInternalID" SERIAL NOT NULL, "address" character varying NOT NULL, "city" character varying NOT NULL, "zipCode" integer NOT NULL, "phoneNumber" character varying NOT NULL, "email" character varying NOT NULL, "notes" character varying NOT NULL, "industryID" integer)`);
        await queryRunner.query(`CREATE TABLE "Version" ("versionID" SERIAL NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_5c667bea1ae1ba3be1ba1aed1ba42" PRIMARY KEY ("versionID"))`);
    }
    async down(queryRunner) {
    }
}
exports.CreateInitialTables1660306612822 = CreateInitialTables1660306612822;
//# sourceMappingURL=1660306612822-CreateInitialTables.js.map
