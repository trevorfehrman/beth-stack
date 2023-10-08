import Elysia from "elysia";
import { BaseHtml } from "../components/base";
import { ctx } from "../context";
import { redirect } from "../lib";

export const newUser = new Elysia()
  .use(ctx)
  .get("new-user", async ({ html, session, set, headers }) => {
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
    return html(() => (
      <BaseHtml>
        <main class="flex w-full flex-col items-center justify-center gap-5">
          <h1 class="font bold text-3xl" safe>
            Hi new user {session.user.name}
          </h1>
          <p>Do you want to join or create an organization?</p>
          <form
            hx-post="/api/organization"
            class="flex flex-col items-center justify-center gap-5"
          >
            <input
              type="text"
              name="organizationName"
              placeholder="organization name"
            />
            <button type="Submit">Create Organization</button>
          </form>
          <form
            hx-post="/api/organization/join"
            class="flex flex-col items-center justify-center gap-5"
          >
            <input
              type="text"
              name="organizationCode"
              placeholder="organization code"
            />
            <button type="Submit">Join Organization</button>
          </form>
        </main>
      </BaseHtml>
    ));
  });
