import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1787060039706 implements MigrationInterface {
  name = 'InitialSchema1787060039706';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "households" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "address" character varying(250), "currency" character varying(3) NOT NULL DEFAULT 'TRY', "invite_code" character varying(12) NOT NULL, "created_by" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2b1aef2640717132e9231aac756" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f95bd58338f4abbe735b87386a" ON "households"  ("invite_code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."household_members_role_enum" AS ENUM('owner', 'admin', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "household_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "household_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."household_members_role_enum" NOT NULL DEFAULT 'member', "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_household_member" UNIQUE ("household_id", "user_id"), CONSTRAINT "PK_198055660706bdbea68909fdb01" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_platform_role_enum" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying(120) NOT NULL, "email" character varying(180) NOT NULL, "password_hash" character varying NOT NULL, "phone" character varying(30), "avatar_url" character varying, "platform_role" "public"."users_platform_role_enum" NOT NULL DEFAULT 'user', "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "email_verified_at" TIMESTAMP WITH TIME ZONE, "last_login_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_hash" character varying(64) NOT NULL, "user_id" uuid NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a7838d2ba25be1342091b6695f" ON "refresh_tokens"  ("token_hash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."verification_tokens_type_enum" AS ENUM('password_reset', 'email_verification')`,
    );
    await queryRunner.query(
      `CREATE TABLE "verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_hash" character varying(64) NOT NULL, "user_id" uuid NOT NULL, "type" "public"."verification_tokens_type_enum" NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f2d4d7a2aa57ef199e61567db22" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_19d8484a0754cd015ca11302a5" ON "verification_tokens"  ("token_hash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_31d2079dc4079b80517d31cf4f" ON "verification_tokens"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "settlements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "household_id" uuid NOT NULL, "from_user_id" uuid NOT NULL, "to_user_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "note" text, "settled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5f523ce152b84e818bff9467aab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e226d380215be99b15adc9729" ON "settlements"  ("household_id", "settled_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bills_type_enum" AS ENUM('elektrik', 'su', 'dogalgaz', 'internet', 'kira', 'aidat', 'diger')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bills_status_enum" AS ENUM('pending', 'paid', 'overdue')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bills_recurrence_enum" AS ENUM('none', 'monthly', 'bimonthly', 'quarterly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "household_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "type" "public"."bills_type_enum" NOT NULL DEFAULT 'diger', "amount" numeric(12,2) NOT NULL, "due_date" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."bills_status_enum" NOT NULL DEFAULT 'pending', "recurrence" "public"."bills_recurrence_enum" NOT NULL DEFAULT 'none', "reminder_days_before" integer NOT NULL DEFAULT '3', "auto_create_expense" boolean NOT NULL DEFAULT true, "paid_at" TIMESTAMP WITH TIME ZONE, "paid_by" character varying, "due_reminder_sent_at" TIMESTAMP WITH TIME ZONE, "overdue_reminder_sent_at" TIMESTAMP WITH TIME ZONE, "notes" text, "created_by" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a56215dfcb525755ec832cc80b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dabfd8b59762eac6a006c547dc" ON "bills"  ("household_id", "due_date") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chores_status_enum" AS ENUM('pending', 'done')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chores_priority_enum" AS ENUM('low', 'medium', 'high')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chores_recurrence_enum" AS ENUM('none', 'daily', 'weekly', 'biweekly', 'monthly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "household_id" uuid NOT NULL, "title" character varying(150) NOT NULL, "description" text, "assigned_to" uuid, "due_date" TIMESTAMP WITH TIME ZONE, "status" "public"."chores_status_enum" NOT NULL DEFAULT 'pending', "priority" "public"."chores_priority_enum" NOT NULL DEFAULT 'medium', "recurrence" "public"."chores_recurrence_enum" NOT NULL DEFAULT 'none', "points" integer NOT NULL DEFAULT '10', "completed_at" TIMESTAMP WITH TIME ZONE, "completed_by" character varying, "reminder_sent_at" TIMESTAMP WITH TIME ZONE, "created_by" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_943e6520135dee468bed5a16181" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4dbc6a32377e5660767f916497" ON "chores"  ("household_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."expenses_category_enum" AS ENUM('market', 'fatura', 'kira', 'temizlik', 'yemek', 'ulasim', 'eglence', 'bakim', 'diger')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."expenses_split_type_enum" AS ENUM('equal', 'exact', 'percentage', 'shares')`,
    );
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "household_id" uuid NOT NULL, "title" character varying(150) NOT NULL, "description" text, "amount" numeric(12,2) NOT NULL, "category" "public"."expenses_category_enum" NOT NULL DEFAULT 'diger', "paid_by" uuid NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "split_type" "public"."expenses_split_type_enum" NOT NULL DEFAULT 'equal', "bill_id" character varying, "created_by" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b6dc9f9bfff767553a4c9c791e" ON "expenses"  ("household_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "expense_shares" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expense_id" uuid NOT NULL, "user_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "weight" numeric(10,2), CONSTRAINT "uq_expense_share" UNIQUE ("expense_id", "user_id"), CONSTRAINT "PK_6797467a312af7a82082f86dc91" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "bill_reminders" boolean NOT NULL DEFAULT true, "expense_alerts" boolean NOT NULL DEFAULT true, "chore_reminders" boolean NOT NULL DEFAULT true, "settlement_alerts" boolean NOT NULL DEFAULT true, "reminder_hour" integer NOT NULL DEFAULT '10', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_64c90edc7310c6be7c10c96f67" UNIQUE ("user_id"), CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_64c90edc7310c6be7c10c96f67" ON "notification_preferences"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('bill_due', 'bill_overdue', 'bill_paid', 'expense_added', 'chore_assigned', 'chore_due', 'chore_completed', 'settlement', 'member_joined')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "household_id" uuid NOT NULL, "user_id" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(150) NOT NULL, "body" text NOT NULL, "data" jsonb, "read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_310667f935698fcd8cb319113a" ON "notifications"  ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."push_tokens_platform_enum" AS ENUM('ios', 'android', 'web')`,
    );
    await queryRunner.query(
      `CREATE TABLE "push_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying(200) NOT NULL, "user_id" uuid NOT NULL, "platform" "public"."push_tokens_platform_enum" NOT NULL, "device_name" character varying(120), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_32734e87f299c29ca3878861f4f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_869b4a9ba2c9e030aafc4b7dc7" ON "push_tokens"  ("token") `,
    );
    await queryRunner.query(
      `CREATE TABLE "bill_participants" ("bill_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_b9682b15322a8c6febbd3aac928" PRIMARY KEY ("bill_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb5252142c5210ea28aa6fd4eb" ON "bill_participants"  ("bill_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea52fc6cda25d81f9408c2b705" ON "bill_participants"  ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "households" ADD CONSTRAINT "FK_d710784d89c73eea4d97a8163cd" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "household_members" ADD CONSTRAINT "FK_6b8b13e8e04d123ec8cb8b5c318" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "household_members" ADD CONSTRAINT "FK_7e5f19ba92bb79aa4a6400e3827" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_tokens" ADD CONSTRAINT "FK_31d2079dc4079b80517d31cf4f2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_5373e88f9b6b5ffc7ee956d5ac4" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_9bc5f8be6355ec04625b4f3f63b" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" ADD CONSTRAINT "FK_5e3d979d1c063368137bf54108c" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bills" ADD CONSTRAINT "FK_16c484189eb4ad0be43ebf7384c" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chores" ADD CONSTRAINT "FK_561a673dfc6e1890fe832b398d9" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chores" ADD CONSTRAINT "FK_0c0375ede09c0de19f362a392a5" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_f2a1a58f5d8abe64cd5676f7ca8" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_aab7e9a857a89a7cb42ef9dad0c" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_shares" ADD CONSTRAINT "FK_07f2ba1f3ce16fa4bf7cb10231e" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_shares" ADD CONSTRAINT "FK_562d5c2c4874f0088a1509530e5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_64c90edc7310c6be7c10c96f675" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_6450ffc1a43e3ae447350a4fe1a" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_tokens" ADD CONSTRAINT "FK_94c371aff70dedeb89dae39f440" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bill_participants" ADD CONSTRAINT "FK_eb5252142c5210ea28aa6fd4ebb" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "bill_participants" ADD CONSTRAINT "FK_ea52fc6cda25d81f9408c2b7055" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bill_participants" DROP CONSTRAINT "FK_ea52fc6cda25d81f9408c2b7055"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bill_participants" DROP CONSTRAINT "FK_eb5252142c5210ea28aa6fd4ebb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "push_tokens" DROP CONSTRAINT "FK_94c371aff70dedeb89dae39f440"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_6450ffc1a43e3ae447350a4fe1a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_64c90edc7310c6be7c10c96f675"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_shares" DROP CONSTRAINT "FK_562d5c2c4874f0088a1509530e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_shares" DROP CONSTRAINT "FK_07f2ba1f3ce16fa4bf7cb10231e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_aab7e9a857a89a7cb42ef9dad0c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_f2a1a58f5d8abe64cd5676f7ca8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chores" DROP CONSTRAINT "FK_0c0375ede09c0de19f362a392a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chores" DROP CONSTRAINT "FK_561a673dfc6e1890fe832b398d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bills" DROP CONSTRAINT "FK_16c484189eb4ad0be43ebf7384c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_5e3d979d1c063368137bf54108c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_9bc5f8be6355ec04625b4f3f63b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settlements" DROP CONSTRAINT "FK_5373e88f9b6b5ffc7ee956d5ac4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_tokens" DROP CONSTRAINT "FK_31d2079dc4079b80517d31cf4f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "household_members" DROP CONSTRAINT "FK_7e5f19ba92bb79aa4a6400e3827"`,
    );
    await queryRunner.query(
      `ALTER TABLE "household_members" DROP CONSTRAINT "FK_6b8b13e8e04d123ec8cb8b5c318"`,
    );
    await queryRunner.query(
      `ALTER TABLE "households" DROP CONSTRAINT "FK_d710784d89c73eea4d97a8163cd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ea52fc6cda25d81f9408c2b705"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eb5252142c5210ea28aa6fd4eb"`,
    );
    await queryRunner.query(`DROP TABLE "bill_participants"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_869b4a9ba2c9e030aafc4b7dc7"`,
    );
    await queryRunner.query(`DROP TABLE "push_tokens"`);
    await queryRunner.query(`DROP TYPE "public"."push_tokens_platform_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_310667f935698fcd8cb319113a"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_64c90edc7310c6be7c10c96f67"`,
    );
    await queryRunner.query(`DROP TABLE "notification_preferences"`);
    await queryRunner.query(`DROP TABLE "expense_shares"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b6dc9f9bfff767553a4c9c791e"`,
    );
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TYPE "public"."expenses_split_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."expenses_category_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4dbc6a32377e5660767f916497"`,
    );
    await queryRunner.query(`DROP TABLE "chores"`);
    await queryRunner.query(`DROP TYPE "public"."chores_recurrence_enum"`);
    await queryRunner.query(`DROP TYPE "public"."chores_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."chores_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dabfd8b59762eac6a006c547dc"`,
    );
    await queryRunner.query(`DROP TABLE "bills"`);
    await queryRunner.query(`DROP TYPE "public"."bills_recurrence_enum"`);
    await queryRunner.query(`DROP TYPE "public"."bills_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."bills_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8e226d380215be99b15adc9729"`,
    );
    await queryRunner.query(`DROP TABLE "settlements"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_31d2079dc4079b80517d31cf4f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_19d8484a0754cd015ca11302a5"`,
    );
    await queryRunner.query(`DROP TABLE "verification_tokens"`);
    await queryRunner.query(
      `DROP TYPE "public"."verification_tokens_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ddc983c5f7bcf132fd8732c3f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a7838d2ba25be1342091b6695f"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_platform_role_enum"`);
    await queryRunner.query(`DROP TABLE "household_members"`);
    await queryRunner.query(`DROP TYPE "public"."household_members_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f95bd58338f4abbe735b87386a"`,
    );
    await queryRunner.query(`DROP TABLE "households"`);
  }
}
