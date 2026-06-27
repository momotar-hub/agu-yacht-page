import fs from "fs";
import path from "path";

// Define the data path
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interface declarations
export interface Profile {
  user_id: string;
  name: string;
  avatar: string; // URL or placeholder color
  role: "Captain" | "Vice Captain" | "Member" | "Admin" | string;
  role_display: string;
  grade?: string; // e.g. "4年生", "3年生", "OB"
  sailing_days?: number;
  badges?: string[];
  is_admin?: boolean;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string; // Simple password check for demo purposes
  profile: Profile;
}

export interface WeatherInfo {
  windSpeed: number; // m/s
  windDirection: string; // e.g., "NE"
  waveHeight: number; // meters
  condition: string; // e.g., "Sunny", "Cloudy", "Rainy"
  temp: number; // °C
}

export interface Reflection {
  id: string;
  date: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  text: string;
  photos: string[];
  weather: WeatherInfo;
  participating_members: string[]; // User IDs of participating members
  created_at: string;
  badgeAwarded?: string;
}

export interface Comment {
  id: string;
  reflection_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  text: string;
  parent_id: string | null; // For replies
  created_at: string;
  badgeAwarded?: string;
}

export interface MaintenanceRecord {
  id: string;
  date_found: string;
  reporter_id: string;
  reporter_name: string;
  boat: string;
  location: string;
  cost: number;
  photos: string[];
  notes: string;
  status: "Pending" | "In Progress" | "Completed";
  created_at: string;
}

export interface PurchaseRecord {
  id: string;
  name: string;
  cost: number;
  category: string;
  buyer_id: string;
  buyer_name: string;
  date: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string; // Markdown supported
  author_id: string;
  author_name: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "practice_reminder" | "comment" | "reply";
  message: string;
  linked_reflection_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface DatabaseSchema {
  users: User[];
  reflections: Reflection[];
  comments: Comment[];
  maintenance: MaintenanceRecord[];
  purchases: PurchaseRecord[];
  documents: Document[];
  notifications: Notification[];
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Default seed data
const SEED_DATA: DatabaseSchema = {
  users: [
    {
      id: "taro",
      email: "taro@agu.ac.jp",
      passwordHash: "sailing",
      profile: {
        user_id: "taro",
        name: "山田 太郎",
        avatar: "⛵",
        role: "Captain",
        role_display: "主将 (4年)",
        grade: "4年生",
        badges: ["10連続乗艇", "強風耐性", "リーダーシップ"]
      }
    },
    {
      id: "misaki",
      email: "misaki@agu.ac.jp",
      passwordHash: "sailing",
      profile: {
        user_id: "misaki",
        name: "佐藤 美咲",
        avatar: "⚓",
        role: "Vice Captain",
        role_display: "副将 (4年)",
        grade: "4年生",
        badges: ["初心者指導者", "安全第一", "5連続乗艇"]
      }
    },
    {
      id: "takumi",
      email: "takumi@agu.ac.jp",
      passwordHash: "sailing",
      profile: {
        user_id: "takumi",
        name: "鈴木 拓海",
        avatar: "🌊",
        role: "Member",
        role_display: "選手 (2年)",
        grade: "2年生",
        badges: ["快速セーラー", "メンテナンスの達人"]
      }
    },
    {
      id: "yuna",
      email: "yuna@agu.ac.jp",
      passwordHash: "sailing",
      profile: {
        user_id: "yuna",
        name: "田中 優奈",
        avatar: "⭐",
        role: "Member",
        role_display: "選手 (1年)",
        grade: "1年生",
        badges: ["フレッシュマン", "日誌皆勤賞"]
      }
    },
    {
      id: "kenta",
      email: "kenta@agu.ac.jp",
      passwordHash: "sailing",
      profile: {
        user_id: "kenta",
        name: "渡辺 健太",
        avatar: "🐋",
        role: "Admin",
        role_display: "マネージャー / 監督",
        grade: "OB / 監督",
        badges: ["クラブの守護神", "歴戦のセーラー"]
      }
    }
  ],
  reflections: [
    {
      id: "ref1",
      date: "2026-06-25",
      author_id: "taro",
      author_name: "山田 太郎",
      author_avatar: "⛵",
      text: "本日は葉山沖にて強風下（平均風速7.5m/s）での帆走練習を行いました。うねりが高く、ジャイビングの際に一度沈（ちん）しかけましたが、クルーの拓海と息を合わせてリカバリー。後半はスタート練習を10本繰り返し、角度とスピードの維持を意識。マーク回航時のラフィングでもう少し早くシートを引く必要があります。全体として充実した練習でした。新入生の優奈も陸上講習とレスキュー艇からの見学で熱心に学んでいました。",
      photos: [
        "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1517026575980-3e1e2dedeab4?w=800&auto=format&fit=crop&q=60"
      ],
      weather: {
        windSpeed: 7.5,
        windDirection: "SSW",
        waveHeight: 1.2,
        condition: "晴れ (Sunny)",
        temp: 24
      },
      participating_members: ["taro", "takumi", "yuna"],
      created_at: "2026-06-25T17:30:00Z"
    },
    {
      id: "ref2",
      date: "2026-06-20",
      author_id: "misaki",
      author_name: "佐藤 美咲",
      author_avatar: "⚓",
      text: "穏やかな微風（風速3.2m/s）でのセーリング練習。1年生の田中優奈をクルーに乗せて、基本動作（タック、ジャイブ）の指導をメインに行いました。優奈は初めての乗艇でしたが、ティラーの感覚やセールのトリムタイミングを覚えるのが非常に早いです。微風時は艇のヒールバランスが生命線となるため、乗員のポジショニング（特に前後）を細かく調整する練習が効果的でした。次回はもう少し風がある中で練習したいですね。",
      photos: [
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=60"
      ],
      weather: {
        windSpeed: 3.2,
        windDirection: "NNE",
        waveHeight: 0.4,
        condition: "薄曇り (Cloudy)",
        temp: 22
      },
      participating_members: ["misaki", "yuna"],
      created_at: "2026-06-20T16:15:00Z"
    }
  ],
  comments: [
    {
      id: "comm1",
      reflection_id: "ref1",
      author_id: "misaki",
      author_name: "佐藤 美咲",
      author_avatar: "⚓",
      text: "強風の練習お疲れ様でした！あの波の中でジャイブのリカバリーができたのは素晴らしい。拓海とのコンビネーションが良くなってきていますね。",
      parent_id: null,
      created_at: "2026-06-25T18:00:00Z"
    },
    {
      id: "comm2",
      reflection_id: "ref1",
      author_id: "taro",
      author_name: "山田 太郎",
      author_avatar: "⛵",
      text: "美咲さん、ありがとうございます！次はマーク回航のライン取りをもっとタイトに攻めるようにします。",
      parent_id: "comm1",
      created_at: "2026-06-25T18:25:00Z"
    },
    {
      id: "comm3",
      reflection_id: "ref2",
      author_id: "yuna",
      author_name: "田中 優奈",
      author_avatar: "⭐",
      text: "美咲先輩、丁寧に教えていただきありがとうございました！風をつかんで艇がすっと進む感覚がすごく楽しかったです。早く一人前になれるよう頑張ります！",
      parent_id: null,
      created_at: "2026-06-20T18:40:00Z"
    }
  ],
  maintenance: [
    {
      id: "maint1",
      date_found: "2026-06-24",
      reporter_id: "takumi",
      reporter_name: "鈴木 拓海",
      boat: "AGU-01 (スナイプ級)",
      location: "ラダーブレード (舵板)",
      cost: 0,
      photos: ["https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&auto=format&fit=crop&q=60"],
      notes: "ラダーの下部に接触痕があり、FRPが約3cmほど剥離しています。水が侵入する恐れがあるため、ゲルコートとエポキシパテによる補修が必要です。現在、乾燥させてサンディングを行っています。今週末の練習までに完了予定です。",
      status: "In Progress",
      created_at: "2026-06-24T10:00:00Z"
    },
    {
      id: "maint2",
      date_found: "2026-06-12",
      reporter_id: "taro",
      reporter_name: "山田 太郎",
      boat: "AGU-02 (470級)",
      location: "メインセール (主帆)",
      cost: 15000,
      photos: ["https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&auto=format&fit=crop&q=60"],
      notes: "スプレッダー先端に引っかかり、メインセールのラフ付近が約15cm避けてしまいました。セイルロフト（専門業者）に持ち込み、プロによるパッチ当て修理を依頼。無事に綺麗に修復され、強度も問題ないレベルに回復しました。修理費用は部費より精算済みです。",
      status: "Completed",
      created_at: "2026-06-12T14:30:00Z"
    }
  ],
  purchases: [
    {
      id: "pur1",
      name: "Harken 40mm トリプルブロック",
      cost: 8400,
      category: "艤装品 (パーツ)",
      buyer_id: "taro",
      buyer_name: "山田 太郎",
      date: "2026-06-15",
      created_at: "2026-06-15T09:00:00Z"
    },
    {
      id: "pur2",
      name: "スナイプ級メインシート (8mmマフィオーリ)",
      cost: 12000,
      category: "ロープ・シート類",
      buyer_id: "takumi",
      buyer_name: "鈴木 拓海",
      date: "2026-06-10",
      created_at: "2026-06-10T11:00:00Z"
    },
    {
      id: "pur3",
      name: "航海用耐水ビニールテープ (白・赤)",
      cost: 1500,
      category: "消耗品",
      buyer_id: "misaki",
      buyer_name: "佐藤 美咲",
      date: "2026-06-18",
      created_at: "2026-06-18T15:00:00Z"
    }
  ],
  documents: [
    {
      id: "doc1",
      title: "安全管理マニュアル & 出航帰港手順",
      content: `# 青山学院大学理工ヨットセーリングクラブ 安全管理指針

海上スポーツであるセーリングは、一歩間違えれば重大な事故に直結します。本指針を部員全員が熟読し、常に安全第一で行動してください。

## 1. 救命胴衣（ライフジャケット）の着用義務
- **乗艇時は必ずライフジャケットを正しく着用すること。**
- ファスナー、バックルが全て留まっているか、乗艇前にペアで相互確認する。
- 笛（ホイッスル）をライフジャケットに常備すること。

## 2. 出航・帰港の判断基準（出航制限）
- **風速制限:** 
  - 平均風速 **8m/s以上**、または突風（ガスト）が **10m/s以上** の場合は一律出航禁止。
  - 1年生が乗艇している場合は、平均風速 **6m/s以上** で出航見合わせ。
- **視界制限:** 濃霧や大雨等で視界が500m以下の場合は出航禁止。
- **気象警報:** 雷警報、強風注意報、波浪注意報発令時は、レスキュー艇の随伴がない限り出航禁止。

## 3. 完沈（完全沈没 / カプサイズ）時の対応手順
1. **人員の安全確保 (最優先):** スキッパーとクルーがお互いの無事を目視・発声で確認。
2. **艇から離れない:** 決して艇から泳ぎ去ってはいけない。艇は最大の浮力体である。
3. **レスキュー要請:** 5分以内に起こせない、または疲労・低体温の兆候がある場合は、大きく手を振って随伴のレスキュー艇、または周囲の艇に救助を求める。
4. **センターボードへの荷重:** センターボードに速やかに乗り、体重をかけて艇をハル（正立）に戻す。

## 4. 緊急連絡先
- 葉山マリーナ管理事務所: 046-875-0000
- 海上保安庁 (緊急通報): 118`,
      author_id: "kenta",
      author_name: "渡辺 健太",
      updated_at: "2026-06-25T12:00:00Z"
    },
    {
      id: "doc2",
      title: "ヨットメンテナンス基本ガイド",
      content: `# 各艇艤装・船体メンテナンス要領

クラブの大切な財産であるヨットを常にベストコンディションに保ち、海上でトラブルを起こさないための基本ガイドです。

## 1. 毎回の着水前チェック
- **ドレンプラグ:** 船尾のドレンプラグがしっかりと締まっているか確認。
- **フォアステイ・サイドステイ:** ワイヤーの「素線切れ（キンク）」がないか、ピンが確実にコッターピンやテープでロックされているか確認。
- **ラダー & センターボード:** 昇降索がスムーズに動くか、ピボットピンの緩みがないか確認。

## 2. 帰着後の真水洗い (塩分除去)
- **船体全体:** 海水は金属パーツの腐食、FRPの劣化を早めます。帰着後は必ず全体をたっぷりの真水で洗うこと。
- **ブロック、カムクリート:** 塩が固まるとクリートの噛み合わせが悪くなります。可動部には念入りに真水をかけ、スムーズに動くことを確認する。
- **セール:** 塩分を含んだまま畳むと、セールのカビや劣化、性能低下につながります。水洗いし、陰干ししてから専用バッグに収納すること。

## 3. トラブル時の報告ルール
- 破損や不具合を発見した場合は、軽微なものであっても**必ずメンテナンス管理に即時登録**すること。
- 「このくらい大丈夫」という油断が、強風下でのマストダウンなどの大事故につながります。`,
      author_id: "kenta",
      author_name: "渡辺 健太",
      updated_at: "2026-06-20T10:00:00Z"
    }
  ],
  notifications: [
    {
      id: "not1",
      user_id: "takumi",
      type: "practice_reminder",
      message: "【練習リマインダー】主将の山田太郎が 2026-06-25 の乗艇日誌を登録しました。あなたの出席が記録されています。振り返りを上手に書いてください！",
      linked_reflection_id: "ref1",
      is_read: false,
      created_at: "2026-06-25T17:35:00Z"
    },
    {
      id: "not2",
      user_id: "yuna",
      type: "practice_reminder",
      message: "【練習リマインダー】主将の山田太郎が 2026-06-25 の乗艇日誌を登録しました。あなたの出席が記録されています。振り返りを上手に書いてください！",
      linked_reflection_id: "ref1",
      is_read: false,
      created_at: "2026-06-25T17:35:00Z"
    },
    {
      id: "not3",
      user_id: "taro",
      type: "comment",
      message: "佐藤美咲さんがあなたの乗艇日誌にコメントしました：「強風の練習お疲れ様でした！あの波の中で…」",
      linked_reflection_id: "ref1",
      is_read: false,
      created_at: "2026-06-25T18:00:00Z"
    }
  ]
};

// Main class to encapsulate database operations
class JsonDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  // Load from file or seed
  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error("Failed to load database. Re-seeding data.", e);
    }
    this.saveData(SEED_DATA);
    return JSON.parse(JSON.stringify(SEED_DATA));
  }

  // Save to file
  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save database file.", e);
    }
  }

  // Persist current state
  private persist() {
    this.saveData(this.data);
  }

  // --- USERS / PROFILES METHODS ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getProfiles(): Profile[] {
    return this.data.users.map(u => {
      // Auto-compute sailing_days for each user
      const sailingDays = this.data.reflections.filter(r => 
        r.author_id === u.id || r.participating_members.includes(u.id)
      ).length;
      return {
        ...u.profile,
        sailing_days: sailingDays
      };
    });
  }

  updateProfile(userId: string, requestingUserId: string, updates: Partial<Profile>): Profile {
    const user = this.getUserById(userId);
    if (!user) throw new Error("User not found");

    // RLS-like Security check: Only self or Admin can update profile
    const requester = this.getUserById(requestingUserId);
    const isAdmin = requester?.profile.role === "Admin" || requester?.profile.is_admin === true;
    if (userId !== requestingUserId && !isAdmin) {
      throw new Error("Access denied: You can only edit your own profile.");
    }

    // Only Admin can update badges/roles/is_admin
    if (updates.badges && !isAdmin) {
      delete updates.badges;
    }
    if (updates.role && !isAdmin) {
      delete updates.role;
      delete updates.role_display;
    }
    if (updates.is_admin !== undefined && !isAdmin) {
      delete updates.is_admin;
    }

    user.profile = {
      ...user.profile,
      ...updates
    } as Profile;

    this.persist();
    return this.getProfiles().find(p => p.user_id === userId)!;
  }

  // Admin add badges / achievements
  adminAddBadge(userId: string, requestingUserId: string, badge: string): Profile {
    const requester = this.getUserById(requestingUserId);
    if (!requester || (requester.profile.role !== "Admin" && !requester.profile.is_admin)) {
      throw new Error("Access denied: Only Admins can issue badges.");
    }

    const user = this.getUserById(userId);
    if (!user) throw new Error("User not found");

    if (!user.profile.badges) {
      user.profile.badges = [];
    }

    if (!user.profile.badges.includes(badge)) {
      user.profile.badges.push(badge);
    }

    this.persist();
    return this.getProfiles().find(p => p.user_id === userId)!;
  }

  adminRemoveBadge(userId: string, requestingUserId: string, badge: string): Profile {
    const requester = this.getUserById(requestingUserId);
    if (!requester || (requester.profile.role !== "Admin" && !requester.profile.is_admin)) {
      throw new Error("Access denied: Only Admins can modify badges.");
    }

    const user = this.getUserById(userId);
    if (!user) throw new Error("User not found");

    if (user.profile.badges) {
      user.profile.badges = user.profile.badges.filter(b => b !== badge);
    }

    this.persist();
    return this.getProfiles().find(p => p.user_id === userId)!;
  }

  // Admin Create User
  adminCreateUser(requestingUserId: string, userData: { email: string; name: string; passwordHash: string; role: string; grade: string; avatar: string; is_admin?: boolean; role_display?: string }): User {
    const requester = this.getUserById(requestingUserId);
    if (!requester || (requester.profile.role !== "Admin" && !requester.profile.is_admin)) {
      throw new Error("Access denied: Only Admins can create users.");
    }

    const emailLower = userData.email.toLowerCase();
    const existing = this.getUserByEmail(emailLower);
    if (existing) {
      throw new Error("このメールアドレスは既に登録されています。");
    }

    const newId = Math.random().toString(36).substring(2, 11);
    
    let role_display = userData.role_display;
    if (!role_display) {
      if (userData.role === "Captain") role_display = `主将 (${userData.grade})`;
      else if (userData.role === "Vice Captain") role_display = `副将 (${userData.grade})`;
      else if (userData.role === "Admin") role_display = "マネージャー / 監督";
      else role_display = userData.role || `選手 (${userData.grade})`;
    }

    const newUser: User = {
      id: newId,
      email: emailLower,
      passwordHash: userData.passwordHash || "sailing",
      profile: {
        user_id: newId,
        name: userData.name,
        avatar: userData.avatar || "⛵",
        role: userData.role,
        role_display: role_display,
        grade: userData.grade,
        badges: [],
        is_admin: userData.is_admin || false
      }
    };

    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  // Admin Delete User
  adminDeleteUser(requestingUserId: string, userIdToDelete: string): boolean {
    const requester = this.getUserById(requestingUserId);
    if (!requester || (requester.profile.role !== "Admin" && !requester.profile.is_admin)) {
      throw new Error("Access denied: Only Admins can delete users.");
    }

    if (requestingUserId === userIdToDelete) {
      throw new Error("自分自身を削除することはできません。");
    }

    const userIndex = this.data.users.findIndex(u => u.id === userIdToDelete);
    if (userIndex === -1) {
      throw new Error("ユーザーが見つかりません。");
    }

    this.data.users.splice(userIndex, 1);
    this.persist();
    return true;
  }


  // --- REFLECTIONS METHODS ---
  getReflections(): Reflection[] {
    return [...this.data.reflections].sort((a, b) => b.date.localeCompare(a.date));
  }

  getReflectionById(id: string): Reflection | undefined {
    return this.data.reflections.find(r => r.id === id);
  }

  createReflection(requestingUserId: string, rData: Omit<Reflection, "id" | "author_id" | "author_name" | "author_avatar" | "created_at">): Reflection {
    const user = this.getUserById(requestingUserId);
    if (!user) throw new Error("User not found");

    const newRef: Reflection = {
      id: generateId(),
      date: rData.date,
      author_id: user.id,
      author_name: user.profile.name,
      author_avatar: user.profile.avatar,
      text: rData.text,
      photos: rData.photos || [],
      weather: rData.weather,
      participating_members: rData.participating_members || [],
      created_at: new Date().toISOString()
    };

    this.data.reflections.push(newRef);

    // Count user's reflections and award badges
    const userRefsCount = this.data.reflections.filter(r => r.author_id === requestingUserId).length;
    if (userRefsCount > 0 && userRefsCount % 10 === 0) {
      const badgeName = `日誌投稿${userRefsCount}回達成！`;
      if (!user.profile.badges) {
        user.profile.badges = [];
      }
      if (!user.profile.badges.includes(badgeName)) {
        user.profile.badges.push(badgeName);
        newRef.badgeAwarded = badgeName;
      }
    }

    this.persist();

    // Trigger Notifications for participating members (Practice Reminders)
    newRef.participating_members.forEach(mId => {
      if (mId !== requestingUserId) {
        this.createNotification(mId, {
          type: "practice_reminder",
          message: `【練習リマインダー】${newRef.author_name}が ${newRef.date} の乗艇日誌を登録しました。振り返りを上手に書いてください！`,
          linked_reflection_id: newRef.id
        });
      }
    });

    return newRef;
  }

  updateReflection(id: string, requestingUserId: string, updates: Partial<Omit<Reflection, "id" | "author_id" | "created_at">>): Reflection {
    const ref = this.getReflectionById(id);
    if (!ref) throw new Error("Reflection not found");

    const user = this.getUserById(requestingUserId);
    const isAdmin = user?.profile.role === "Admin";

    // RLS Security check
    if (ref.author_id !== requestingUserId && !isAdmin) {
      throw new Error("Access denied: You can only edit your own sailing log.");
    }

    if (updates.date) ref.date = updates.date;
    if (updates.text) ref.text = updates.text;
    if (updates.photos) ref.photos = updates.photos;
    if (updates.weather) ref.weather = { ...ref.weather, ...updates.weather };
    if (updates.participating_members) ref.participating_members = updates.participating_members;

    this.persist();
    return ref;
  }

  deleteReflection(id: string, requestingUserId: string): boolean {
    const ref = this.getReflectionById(id);
    if (!ref) throw new Error("Reflection not found");

    const user = this.getUserById(requestingUserId);
    const isAdmin = user?.profile.role === "Admin";

    // RLS Security check
    if (ref.author_id !== requestingUserId && !isAdmin) {
      throw new Error("Access denied: You can only delete your own sailing log.");
    }

    this.data.reflections = this.data.reflections.filter(r => r.id !== id);
    // Cascade delete comments
    this.data.comments = this.data.comments.filter(c => c.reflection_id !== id);
    // Cascade delete notifications linked to this reflection
    this.data.notifications = this.data.notifications.filter(n => n.linked_reflection_id !== id);

    this.persist();
    return true;
  }


  // --- COMMENTS METHODS ---
  getComments(reflectionId: string): Comment[] {
    return this.data.comments
      .filter(c => c.reflection_id === reflectionId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  createComment(requestingUserId: string, reflectionId: string, text: string, parentId: string | null): Comment {
    const user = this.getUserById(requestingUserId);
    if (!user) throw new Error("User not found");

    const ref = this.getReflectionById(reflectionId);
    if (!ref) throw new Error("Reflection not found");

    const newComment: Comment = {
      id: generateId(),
      reflection_id: reflectionId,
      author_id: requestingUserId,
      author_name: user.profile.name,
      author_avatar: user.profile.avatar,
      text,
      parent_id: parentId,
      created_at: new Date().toISOString()
    };

    this.data.comments.push(newComment);

    // Count user's comments and award badges
    const userCommentsCount = this.data.comments.filter(c => c.author_id === requestingUserId).length;
    if (userCommentsCount > 0 && userCommentsCount % 10 === 0) {
      const badgeName = `コメント投稿${userCommentsCount}回達成！`;
      if (!user.profile.badges) {
        user.profile.badges = [];
      }
      if (!user.profile.badges.includes(badgeName)) {
        user.profile.badges.push(badgeName);
        newComment.badgeAwarded = badgeName;
      }
    }

    this.persist();

    // Notify author of reflection (if comment author is not the reflection author)
    if (ref.author_id !== requestingUserId) {
      this.createNotification(ref.author_id, {
        type: "comment",
        message: `${user.profile.name}さんがあなたの乗艇日誌にコメントしました：「${text.slice(0, 20)}${text.length > 20 ? "..." : ""}」`,
        linked_reflection_id: ref.id
      });
    }

    // Notify original comment author if this is a reply
    if (parentId) {
      const parentComment = this.data.comments.find(c => c.id === parentId);
      if (parentComment && parentComment.author_id !== requestingUserId && parentComment.author_id !== ref.author_id) {
        this.createNotification(parentComment.author_id, {
          type: "reply",
          message: `${user.profile.name}さんがあなたのコメントに返信しました：「${text.slice(0, 20)}${text.length > 20 ? "..." : ""}」`,
          linked_reflection_id: ref.id
        });
      }
    }

    return newComment;
  }

  deleteComment(id: string, requestingUserId: string): boolean {
    const comment = this.data.comments.find(c => c.id === id);
    if (!comment) throw new Error("Comment not found");

    const user = this.getUserById(requestingUserId);
    const isAdmin = user?.profile.role === "Admin";

    // RLS Security check: Comment author or Admin
    if (comment.author_id !== requestingUserId && !isAdmin) {
      throw new Error("Access denied: You can only delete your own comments.");
    }

    this.data.comments = this.data.comments.filter(c => c.id !== id && c.parent_id !== id);
    this.persist();
    return true;
  }


  // --- MAINTENANCE METHODS ---
  getMaintenanceRecords(): MaintenanceRecord[] {
    return [...this.data.maintenance].sort((a, b) => b.date_found.localeCompare(a.date_found));
  }

  createMaintenanceRecord(requestingUserId: string, mData: Omit<MaintenanceRecord, "id" | "reporter_id" | "reporter_name" | "created_at">): MaintenanceRecord {
    const user = this.getUserById(requestingUserId);
    if (!user) throw new Error("User not found");

    const newRecord: MaintenanceRecord = {
      id: generateId(),
      date_found: mData.date_found,
      reporter_id: requestingUserId,
      reporter_name: user.profile.name,
      boat: mData.boat,
      location: mData.location,
      cost: mData.cost || 0,
      photos: mData.photos || [],
      notes: mData.notes,
      status: mData.status || "Pending",
      created_at: new Date().toISOString()
    };

    this.data.maintenance.push(newRecord);
    this.persist();
    return newRecord;
  }

  updateMaintenanceRecord(id: string, requestingUserId: string, updates: Partial<Omit<MaintenanceRecord, "id" | "reporter_id" | "created_at">>): MaintenanceRecord {
    const record = this.data.maintenance.find(m => m.id === id);
    if (!record) throw new Error("Record not found");

    const user = this.getUserById(requestingUserId);
    const isAdmin = user?.profile.role === "Admin";

    // RLS Security check: Only reporter or Admin can update
    if (record.reporter_id !== requestingUserId && !isAdmin) {
      throw new Error("Access denied: You can only edit your own maintenance records.");
    }

    if (updates.date_found) record.date_found = updates.date_found;
    if (updates.boat) record.boat = updates.boat;
    if (updates.location) record.location = updates.location;
    if (updates.cost !== undefined) record.cost = updates.cost;
    if (updates.photos) record.photos = updates.photos;
    if (updates.notes) record.notes = updates.notes;
    if (updates.status) record.status = updates.status;

    this.persist();
    return record;
  }

  deleteMaintenanceRecord(id: string, requestingUserId: string): boolean {
    const record = this.data.maintenance.find(m => m.id === id);
    if (!record) throw new Error("Record not found");

    const user = this.getUserById(requestingUserId);
    const isAdmin = user?.profile.role === "Admin";

    // RLS Security check: Only reporter or Admin can delete
    if (record.reporter_id !== requestingUserId && !isAdmin) {
      throw new Error("Access denied: You can only delete your own maintenance records.");
    }

    this.data.maintenance = this.data.maintenance.filter(m => m.id !== id);
    this.persist();
    return true;
  }


  // --- PURCHASES METHODS ---
  getPurchases(): PurchaseRecord[] {
    return [...this.data.purchases].sort((a, b) => b.date.localeCompare(a.date));
  }

  createPurchase(requestingUserId: string, pData: Omit<PurchaseRecord, "id" | "buyer_id" | "buyer_name" | "created_at">): PurchaseRecord {
    const user = this.getUserById(requestingUserId);
    if (!user) throw new Error("User not found");

    const newPurchase: PurchaseRecord = {
      id: generateId(),
      name: pData.name,
      cost: pData.cost,
      category: pData.category,
      buyer_id: requestingUserId,
      buyer_name: user.profile.name,
      date: pData.date,
      created_at: new Date().toISOString()
    };

    this.data.purchases.push(newPurchase);
    this.persist();
    return newPurchase;
  }

  updatePurchase(id: string, requestingUserId: string, updates: Partial<Omit<PurchaseRecord, "id" | "buyer_id" | "created_at">>): PurchaseRecord {
    const pur = this.data.purchases.find(p => p.id === id);
    if (!pur) throw new Error("Purchase not found");

    const user = this.getUserById(requestingUserId);
    const isAdmin = user?.profile.role === "Admin";

    // RLS Security check: Buyer or Admin
    if (pur.buyer_id !== requestingUserId && !isAdmin) {
      throw new Error("Access denied: You can only edit your own purchase history.");
    }

    if (updates.name) pur.name = updates.name;
    if (updates.cost !== undefined) pur.cost = updates.cost;
    if (updates.category) pur.category = updates.category;
    if (updates.date) pur.date = updates.date;

    this.persist();
    return pur;
  }

  deletePurchase(id: string, requestingUserId: string): boolean {
    const pur = this.data.purchases.find(p => p.id === id);
    if (!pur) throw new Error("Purchase not found");

    const user = this.getUserById(requestingUserId);
    const isAdmin = user?.profile.role === "Admin";

    // RLS Security check
    if (pur.buyer_id !== requestingUserId && !isAdmin) {
      throw new Error("Access denied: You can only delete your own purchase records.");
    }

    this.data.purchases = this.data.purchases.filter(p => p.id !== id);
    this.persist();
    return true;
  }


  // --- DOCUMENTS (WIKI) METHODS ---
  getDocuments(): Document[] {
    return this.data.documents;
  }

  getDocumentById(id: string): Document | undefined {
    return this.data.documents.find(d => d.id === id);
  }

  createDocument(requestingUserId: string, title: string, content: string): Document {
    const user = this.getUserById(requestingUserId);
    if (!user || (user.profile.role !== "Admin" && !user.profile.is_admin)) {
      throw new Error("Access denied: Only Admins can create Wiki documents.");
    }

    const newDoc: Document = {
      id: generateId(),
      title,
      content,
      author_id: requestingUserId,
      author_name: user.profile.name,
      updated_at: new Date().toISOString()
    };

    this.data.documents.push(newDoc);
    this.persist();
    return newDoc;
  }

  updateDocument(id: string, requestingUserId: string, title: string, content: string): Document {
    const user = this.getUserById(requestingUserId);
    if (!user || (user.profile.role !== "Admin" && !user.profile.is_admin)) {
      throw new Error("Access denied: Only Admins can modify Wiki documents.");
    }

    const doc = this.data.documents.find(d => d.id === id);
    if (!doc) throw new Error("Document not found");

    doc.title = title;
    doc.content = content;
    doc.updated_at = new Date().toISOString();

    this.persist();
    return doc;
  }

  deleteDocument(id: string, requestingUserId: string): boolean {
    const user = this.getUserById(requestingUserId);
    if (!user || (user.profile.role !== "Admin" && !user.profile.is_admin)) {
      throw new Error("Access denied: Only Admins can delete Wiki documents.");
    }

    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.persist();
    return true;
  }


  // --- NOTIFICATIONS METHODS ---
  getNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  createNotification(userId: string, nData: Omit<Notification, "id" | "user_id" | "is_read" | "created_at">): Notification {
    const newNot: Notification = {
      id: generateId(),
      user_id: userId,
      type: nData.type,
      message: nData.message,
      linked_reflection_id: nData.linked_reflection_id,
      is_read: false,
      created_at: new Date().toISOString()
    };

    this.data.notifications.push(newNot);
    this.persist();

    // In a full implementation, trigger Server-Sent Event or WebSockets here
    this.emitEvent(userId, newNot);

    return newNot;
  }

  markNotificationAsRead(id: string, requestingUserId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (!notif) throw new Error("Notification not found");

    if (notif.user_id !== requestingUserId) {
      throw new Error("Access denied");
    }

    notif.is_read = true;
    this.persist();
    return true;
  }

  markAllNotificationsAsRead(requestingUserId: string): boolean {
    this.data.notifications.forEach(n => {
      if (n.user_id === requestingUserId) {
        n.is_read = true;
      }
    });
    this.persist();
    return true;
  }

  // --- SIMPLE REALTIME SERVER-SENT EVENTS ROUTER COUPLING ---
  private activeListeners: Map<string, ((data: any) => void)[]> = new Map();

  addEventListener(userId: string, callback: (data: any) => void) {
    if (!this.activeListeners.has(userId)) {
      this.activeListeners.set(userId, []);
    }
    this.activeListeners.get(userId)!.push(callback);
  }

  removeEventListener(userId: string, callback: (data: any) => void) {
    const listeners = this.activeListeners.get(userId);
    if (listeners) {
      this.activeListeners.set(userId, listeners.filter(cb => cb !== callback));
    }
  }

  private emitEvent(userId: string, data: any) {
    const listeners = this.activeListeners.get(userId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error("SSE Listener threw error", e);
        }
      });
    }
  }
}

export const db = new JsonDatabase();
