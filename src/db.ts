import SQLite from "better-sqlite3"
import {
  Kysely,
  sql,
  SqliteDialect,
  type Generated,
  type ValueExpression,
} from 'kysely'
interface DbType {
  http_request_result: {
    id: Generated<number>;
    primary_key: string;
    url: string;
    request_method: "GET" | "POST";
    request_header: string;
    response_code: number;
    response_header: string;
    response_binary: Buffer;
    insert_program_version: string;
    created_at: string;
    updated_at: string;
  },
  ia_plala_base_url_list: {
    id: Generated<number>;
    base_url: string;
    insert_program_version: string;
    created_at: string;
    updated_at: string;
  },
  plala_town_space_list: {
    id: Generated<number>;
    source_ia_pkey: string;
    base_url: string;
    title: string;
    description: string;
    insert_program_version: string;
    created_at: string;
    updated_at: string;
  },
  active_plala_hp_space_list: {
    id: Generated<number>;
    base_url: string;
    title: string;
    status: "success" | "warn" | "error";
    last_up: string | null;
    insert_program_version: string;
    created_at: string;
    updated_at: string;
  },
  active_plala_hp_space_child_file_list: {
    id: Generated<number>;
    base_url: string;
    child_url: string;
    insert_program_version: string;
    created_at: string;
    updated_at: string;
  },
  active_plala_hp_space_child_file_list_inf: {
    id: Generated<number>;
    base_url: string;
    child_url: string;
    insert_program_version: string;
    created_at: string;
    updated_at: string;
  }
}
const insert_program_version = date2Sql(new Date('2025-03-04T10:52:37.961Z'));
export class Database {
  private db!: Kysely<DbType>;
  async init() {
    if (this.db != null) {
      return;
    }
    this.db = new Kysely<DbType>({
      dialect: new SqliteDialect({ database: new SQLite("database.db") }),
      // log(event): void {
      //   if (event.level === "query") {
      //     console.log(event.query.sql);
      //     console.log(event.query.parameters);
      //   }
      // },
    });
    await sql<DbType>`
    CREATE TABLE IF NOT EXISTS http_request_result(
      id                     INTEGER NOT NULL PRIMARY KEY,
      primary_key            TEXT    NOT NULL UNIQUE CHECK(primary_key<>''),
      url                    TEXT    NOT NULL,
      request_method         TEXT    NOT NULL CHECK(request_method='GET' OR request_method='POST'),
      request_header         TEXT    NOT NULL CHECK(json_valid(request_header)),
      response_code          INTEGER NOT NULL CHECK( 0 < response_code ),
      response_header        TEXT    NOT NULL CHECK(json_valid(response_header)),
      response_binary        BLOB    NOT NULL,
      insert_program_version TEXT    NOT NULL,
      created_at             TEXT    NOT NULL,
      updated_at             TEXT    NOT NULL
    ) strict;`.execute(this.db);
    await sql<DbType>`
    CREATE TABLE IF NOT EXISTS ia_plala_base_url_list(
      id                     INTEGER NOT NULL PRIMARY KEY,
      base_url               TEXT    NOT NULL UNIQUE CHECK(base_url<>''),
      insert_program_version TEXT    NOT NULL,
      created_at             TEXT    NOT NULL,
      updated_at             TEXT    NOT NULL
    ) strict;`.execute(this.db);
    await sql<DbType>`
    CREATE TABLE IF NOT EXISTS plala_town_space_list(
      id                     INTEGER NOT NULL PRIMARY KEY,
      source_ia_pkey         TEXT    NOT NULL CHECK(source_ia_pkey<>''),
      base_url               TEXT    NOT NULL CHECK(base_url<>''),
      title                  TEXT    NOT NULL,
      description            TEXT    NOT NULL,
      insert_program_version TEXT    NOT NULL,
      created_at             TEXT    NOT NULL,
      updated_at             TEXT    NOT NULL,
      UNIQUE(source_ia_pkey,base_url)
    ) strict ;`.execute(this.db);
    await sql<DbType>`CREATE TABLE IF NOT EXISTS active_plala_hp_space_list(
      id                     INTEGER NOT NULL PRIMARY KEY,
      base_url               TEXT    NOT NULL UNIQUE CHECK(base_url<>''),
      title                  TEXT    NOT NULL,
      status                 TEXT    NOT NULL CHECK(status='success' OR status='warn' OR status='error'),
      last_up                TEXT        NULL,
      insert_program_version TEXT    NOT NULL,
      created_at             TEXT    NOT NULL,
      updated_at             TEXT    NOT NULL
    ) strict ;`.execute(this.db);
    await sql<DbType>`CREATE TABLE IF NOT EXISTS active_plala_hp_space_child_file_list(
      id                     INTEGER NOT NULL PRIMARY KEY,
      base_url               TEXT    NOT NULL CHECK(base_url<>''),
      child_url              TEXT    NOT NULL CHECK(child_url<>''),
      insert_program_version TEXT    NOT NULL,
      created_at             TEXT    NOT NULL,
      updated_at             TEXT    NOT NULL,
      UNIQUE(base_url,child_url)
    ) strict ;`.execute(this.db);
    await sql<DbType>`CREATE TABLE IF NOT EXISTS active_plala_hp_space_child_file_list_inf(
      id                     INTEGER NOT NULL PRIMARY KEY,
      base_url               TEXT    NOT NULL CHECK(base_url<>''),
      child_url              TEXT    NOT NULL CHECK(child_url<>''),
      insert_program_version TEXT    NOT NULL,
      created_at             TEXT    NOT NULL,
      updated_at             TEXT    NOT NULL,
      UNIQUE(base_url,child_url)
    ) strict ;`.execute(this.db);
  }
  async getPrimaryKeyList(prefix: string) {
    const res = await this.db
      .selectFrom("http_request_result")
      .select("http_request_result.primary_key")
      .where("primary_key", "like", `${prefix}%`)
      .execute();
    return res?.map(v => v.primary_key) ?? [];
  }
  async getPrimaryKey(pk: string) {
    const res = await this.db
      .selectFrom("http_request_result")
      .selectAll()
      .where("primary_key", "=", pk)
      .limit(1)
      .execute();
    return res?.[0];
  }
  async saveResponse(
    primaryKey: string,
    url: string,
    method: "GET" | "POST",
    requestHeader: Record<string, string>,
    responseCode: number,
    responseHeader: Record<string, string>,
    responseBinary: Buffer,
  ) {
    await this
      .db
      .insertInto("http_request_result")
      .values({
        primary_key: primaryKey,
        url: url,
        request_method: method,
        request_header: sortRecord(requestHeader),
        response_code: responseCode,
        response_header: sortRecord(responseHeader),
        response_binary: responseBinary,
        insert_program_version: insert_program_version,
        created_at: date2Sql(new Date()),
        updated_at: date2Sql(new Date()),
      })
      .onConflict(cb =>
        cb.column("primary_key").doUpdateSet({
          url: url,
          request_method: method,
          request_header: sortRecord(requestHeader),
          response_code: responseCode,
          response_header: sortRecord(responseHeader),
          response_binary: responseBinary,
          insert_program_version: insert_program_version,
          //created_at: date2Sql(new Date()),
          updated_at: date2Sql(new Date()),
        })
      )
      .execute();
  }
  async getBaseUrlList() {
    const baseUrlList = new Set<string>();
    await this.db.selectFrom("ia_plala_base_url_list").select("base_url").execute().then(l => {
      l.forEach(i => {
        baseUrlList.add(i.base_url);
      });
    });
    await this.db.selectFrom("plala_town_space_list").select("base_url").execute().then(l => {
      l.forEach(i => {
        baseUrlList.add(i.base_url);
      });
    });
    return baseUrlList;
  }
  async replaceIaPlalaBaseUrl(baseUrlList: Set<string>) {
    await this.db.deleteFrom("ia_plala_base_url_list").execute();
    await this.db.transaction().execute(async (trx) => {
      for (const baseUrl of [...baseUrlList].toSorted()) {
        await trx.insertInto("ia_plala_base_url_list")
          .values({
            base_url: baseUrl,
            insert_program_version: insert_program_version,
            created_at: date2Sql(new Date()),
            updated_at: date2Sql(new Date()),
          }).execute();
      }
    });
  }
  async replacePlalaTownSpaceList(list: {
    sourceIaPkey: string,
    baseUrl: string,
    title: string,
    description: string,
  }[]) {
    await this.db.deleteFrom("plala_town_space_list").execute();
    await this.db.transaction().execute(async (trx) => {
      for (const item of list) {
        await trx.insertInto("plala_town_space_list")
          .values({
            base_url: item.baseUrl,
            source_ia_pkey: item.sourceIaPkey,
            title: item.title,
            description: item.description,
            insert_program_version: insert_program_version,
            created_at: date2Sql(new Date()),
            updated_at: date2Sql(new Date()),
          }).execute();
      }
    });
  }
  async replaceActivePlalaHpSpaceList(
    list: {
      baseUrl: string,
      title: string,
      lastUpdateAt: Date | null,
      status: "success" | "warn" | "error",
    }[]
  ) {
    await this.db.deleteFrom("active_plala_hp_space_list").execute();
    await this.db.transaction().execute(async (trx) => {
      for (const item of list) {
        await trx.insertInto("active_plala_hp_space_list")
          .values({
            base_url: item.baseUrl,
            title: item.title,
            last_up: item.lastUpdateAt ? date2Sql(item.lastUpdateAt) : null,
            status: item.status,
            insert_program_version: insert_program_version,
            created_at: date2Sql(new Date()),
            updated_at: date2Sql(new Date()),
          }).execute();
      }
    });
  }
  async getActivePlalaHpSpaceListUrl() {
    const baseUrlList = await this.db
      .selectFrom("active_plala_hp_space_list")
      .select("active_plala_hp_space_list.base_url")
      .where("status", "!=", "error")
      .execute()
      .then(r => r.map(i => i.base_url));
    return baseUrlList;
  }
  async getActivePlalaHpSpaceList2(params: {
    includeSuccess: boolean,
    includeWarn: boolean,
    includeError: boolean,
    limit?: number,
    offset?: number,
  }) {
    let query = this.db
      .selectFrom("active_plala_hp_space_list")
      .select(["id", "base_url", "title", "status", "last_up"]);
    if (params.includeError == false && params.includeWarn == false && params.includeSuccess == false) {
      return { queryCount: 0, result: [] };
    } else if (params.includeError && params.includeWarn && params.includeSuccess) {
      // none
    } else {
      const l: ("success" | "warn" | "error")[] = [];
      if (params.includeSuccess) { l.push("success"); };
      if (params.includeWarn) { l.push("warn"); };
      if (params.includeError) { l.push("error"); };
      query = query.where("status", "in", l);
    }
    let queryCount = await query.select(this.db.fn.countAll().as("count")).executeTakeFirstOrThrow().then(r => r.count);
    if (params.limit != null) {
      query = query.limit(params.limit);
    }
    if (params.offset != null) {
      query = query.offset(params.offset);
    }
    query = query.orderBy("id", "asc");
    const result = await query.execute();
    return { queryCount, result };
  }
  async isActivePlalaHpSpaceChildFileExist(baseUrl: string) {
    const hasData = await this.db
      .selectFrom("active_plala_hp_space_child_file_list")
      .select("active_plala_hp_space_child_file_list.id")
      .where("base_url", "=", baseUrl)
      .limit(1)
      .execute()
      .then(r => r?.[0]?.id != null);
    return hasData;
  }
  async replaceActivePlalaHpSpaceChildFileList(baseUrl: string, childFileList: string[]) {
    await this.db.deleteFrom("active_plala_hp_space_child_file_list").where("base_url", "=", baseUrl).execute();
    await this.db.transaction().execute(async (trx) => {
      for (const item of childFileList) {
        await trx.insertInto("active_plala_hp_space_child_file_list")
          .values({
            base_url: baseUrl,
            child_url: item,
            insert_program_version: insert_program_version,
            created_at: date2Sql(new Date()),
            updated_at: date2Sql(new Date()),
          }).execute();
      }
    });
  }
  async getArchivePlalaHpSpaceChildFileList() {
    const allDatas = await this.db
      .selectFrom("active_plala_hp_space_child_file_list")
      .select("active_plala_hp_space_child_file_list.child_url")
      .execute()
    return allDatas;
  }
  async isActivePlalaHpSpaceChildFileExistInf(baseUrl: string) {
    const hasData = await this.db
      .selectFrom("active_plala_hp_space_child_file_list_inf")
      .select("active_plala_hp_space_child_file_list_inf.id")
      .where("base_url", "=", baseUrl)
      .limit(1)
      .execute()
      .then(r => r?.[0]?.id != null);
    return hasData;
  }
  async replaceActivePlalaHpSpaceChildFileListInf(baseUrl: string, childFileList: string[]) {
    await this.db.deleteFrom("active_plala_hp_space_child_file_list_inf").where("base_url", "=", baseUrl).execute();
    await this.db.transaction().execute(async (trx) => {
      for (const item of childFileList) {
        await trx.insertInto("active_plala_hp_space_child_file_list_inf")
          .values({
            base_url: baseUrl,
            child_url: item,
            insert_program_version: insert_program_version,
            created_at: date2Sql(new Date()),
            updated_at: date2Sql(new Date()),
          }).execute();
      }
    });
  }
  async getActivePlalaHpSpaceChildFileListInf(baseUrl: string) {
    const allDatas = await this.db
      .selectFrom("active_plala_hp_space_child_file_list_inf")
      .select("child_url")
      .where("base_url", "=", baseUrl)
      .orderBy("child_url")
      .execute()
      // http://example.com/a////////b.html の様なURL混入の対策でフィルタリング
      .then(r => r.map(i => i.child_url).filter(u => new URL(u).pathname.includes("//") == false));
    return allDatas;
  }
}
export const dbInstance = new Database();
export type dbInstance = typeof dbInstance;
function sortRecord(data: Record<string, string>) {
  const sortedData = Object.fromEntries(
    Object.entries(data).sort((a, b) => {
      return a[0].localeCompare(b[0]);
    }),
  );
  const jsonString = JSON.stringify(sortedData);
  return jsonString;
}
function date2Sql(date: Date) {
  const result = sql<string>`strftime('%F %R:%f',${date.getTime() / 1000},'unixepoch')`;
  return result;
}
