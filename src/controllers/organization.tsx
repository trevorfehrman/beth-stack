import { eq, or } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { ctx } from "../context";
import { db } from "../db/primary";
import { organizations, user } from "../db/primary/schema";
import { pushToTenantDb } from "../db/tenant";
import { createdDatabaseId, redirect, syncIfLocal } from "../lib";

export const organizationsController = new Elysia({
  prefix: "/organization",
})
  .use(ctx)
  .post(
    "/",
    async ({ body, session, set, headers, turso }) => {
      if (!session) {
        redirect(
          {
            set,
            headers,
          },
          "/login",
        );
        return;
      }

      const dbName = `org-${createdDatabaseId()}`;
      const {
        database: { Name },
      } = await turso.databases.create({ name: dbName });
      const { jwt } = await turso.logicalDatabases.mintAuthToken(
        "trevorfehrman",
        dbName,
      );

      try {
        await pushToTenantDb({
          dbName: Name,
          authToken: jwt,
        });
      } catch (e) {
        console.log(e);
      }

      const [result] = await db
        .insert(organizations)
        .values({
          name: body.organizationName,
          database_name: Name,
          database_auth_token: jwt,
        })
        .returning({
          id: organizations.id,
        });

      if (!result) {
        set.status = "Internal Server Error";
        return "Internal Server Error";
      }

      await db
        .update(user)
        .set({
          organization_id: result.id,
        })
        .where(eq(user.id, session.user.id));

      await syncIfLocal();

      redirect(
        {
          set,
          headers,
        },
        "/dashboard",
      );
    },
    {
      body: t.Object({
        organizationName: t.String({
          minLength: 1,
          maxLength: 30,
        }),
      }),
    },
  )
  .post(
    "/join",
    async ({ body, session, set, headers, turso }) => {
      if (!session) {
        redirect(
          {
            set,
            headers,
          },
          "/login",
        );
        return;
      }

      const organization = await db.query.organizations.findFirst({
        where: (organizations, { eq }) =>
          eq(organizations.database_name, body.organizationCode),
      });

      if (!organization) {
        set.status = "Not Found";
        return "Organization not found";
      }

      await db
        .update(user)
        .set({
          organization_id: organization.id,
        })
        .where(eq(user.id, session.user.id));

      await syncIfLocal();

      redirect(
        {
          set,
          headers,
        },
        "/dashboard",
      );
    },
    {
      body: t.Object({
        organizationCode: t.String({
          minLength: 11,
          maxLength: 11,
        }),
      }),
    },
  );
