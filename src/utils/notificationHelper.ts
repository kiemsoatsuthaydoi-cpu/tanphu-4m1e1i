import { QualityReport, AppNotification, BroadcastNotice, User, ChatMessage, ForumTopic, ForumReply } from "../types";

export function findMentionedUsers(text: string | undefined | null, users?: User[]): User[] {
  if (!text || !users || users.length === 0) return [];
  const matched: User[] = [];
  users.forEach((u) => {
    if (u.fullName && text.includes(`@${u.fullName}`)) {
      matched.push(u);
    }
  });
  return matched;
}

export function parseReportTimestamp(ts: string): Date {
  try {
    if (!ts) return new Date();
    if (ts.includes("T") && ts.includes("-")) {
      return new Date(ts);
    }
    
    const parts = ts.trim().split(/\s+/);
    if (parts.length < 2) return new Date(ts);
    
    const timePart = parts[0]; // "HH:mm:ss"
    const datePart = parts[1]; // "DD/MM/YYYY"
    
    const timeSubparts = timePart.split(":");
    const dateSubparts = datePart.split("/");
    
    if (timeSubparts.length >= 2 && dateSubparts.length === 3) {
      const day = parseInt(dateSubparts[0], 10);
      const month = parseInt(dateSubparts[1], 10) - 1;
      const yearStr = dateSubparts[2].trim();
      const year = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
      
      const hours = parseInt(timeSubparts[0], 10);
      const minutes = parseInt(timeSubparts[1], 10);
      const seconds = timeSubparts[2] ? parseInt(timeSubparts[2], 10) : 0;
      
      return new Date(year, month, day, hours, minutes, seconds);
    }
  } catch (e) {
    console.error("Error parsing timestamp:", ts, e);
  }
  return new Date();
}

export function generateNotifications(
  reports: QualityReport[],
  deletedNotifIds: string[],
  broadcasts?: BroadcastNotice[],
  chats?: ChatMessage[],
  users?: User[],
  topics?: ForumTopic[],
  replies?: ForumReply[]
): AppNotification[] {
  const list: AppNotification[] = [];

  // Generate notifications for broadcasts first
  if (broadcasts && Array.isArray(broadcasts)) {
    broadcasts.forEach((b) => {
      list.push({
        id: `broadcast-${b.id}`,
        title: b.type || "📢 BẢN TIN",
        description: b.content,
        timestamp: b.timestamp,
        type: "broadcast",
        targetReportId: undefined,
        authorName: b.sender,
        factoryName: "Ban quản trị"
      });
    });
  }
  
  reports.forEach((report) => {
    // Skip deleted reports
    if (report.isDeleted) return;

    // 1. Report post notification
    list.push({
      id: `report-${report.id}`,
      title: "Bản tin 4M1E1I mới",
      description: `Đăng bởi ${report.uploaderName} tại ${report.factory}. Nội dung: "${report.content.substring(0, 45)}..."`,
      timestamp: report.timestamp,
      type: "new_report",
      targetReportId: report.id,
      authorName: report.uploaderName,
      factoryName: report.factory
    });

    // 2. Report edited / updated notification
    if (report.updateLogs && report.updateLogs.length > 0) {
      const capitalizeName = (name: string): string => {
        if (!name) return "";
        return name
          .split(/\s+/)
          .map((word) => {
            if (!word) return "";
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join(" ");
      };

      const guessGenderPrefix = (fullName: string): string => {
        const realName = fullName.replace(/\s*\(.*?\)\s*/g, " ").trim().toLowerCase();
        
        if (realName.includes(" thị ") || realName.includes(" thị") || realName.endsWith(" thị")) {
          return "Chị";
        }
        if (realName.includes(" văn ") || realName.includes(" văn") || realName.endsWith(" văn")) {
          return "Anh";
        }
        
        const words = realName.split(/\s+/);
        if (words.length > 0) {
          const givenName = words[words.length - 1];
          
          const femaleGivenNames = [
            "phượng", "tuyền", "lan", "nga", "yến", "thảo", "quỳnh", 
            "diệp", "liên", "hương", "bích", "nguyệt", "tuyết", "hằng", 
            "dung", "oanh", "mai", "vy"
          ];
          
          const maleGivenNames = [
            "thông", "tuấn", "quốc", "đức", "hùng", "mạnh", "dũng", 
            "sơn", "huy", "nam", "trung", "hoàng", "toàn", "thắng", 
            "minh", "long", "khang", "phúc", "hải", "phong", "kiệt", 
            "thịnh", "tùng", "bảo", "thành", "sáng", "tiến", "quang",
            "đạt", "quân"
          ];
          
          if (femaleGivenNames.includes(givenName)) {
            return "Chị";
          }
          if (maleGivenNames.includes(givenName)) {
            return "Anh";
          }
        }
        return "";
      };

      const getCleanName = (name: string | undefined | null): string => {
        if (!name || typeof name !== "string") return "";
        const cleaned = name.replace(/\s+/g, " ").trim();
        const match = cleaned.match(/^(.*?)\((.*?)\)$/);
        if (match) {
          const namePart = capitalizeName(match[1].trim());
          const deptPart = capitalizeName(match[2].trim());
          return `${namePart} (${deptPart})`;
        }
        return capitalizeName(cleaned);
      };

      report.updateLogs.forEach((log, idx) => {
        const timeMatch = log.match(/\((\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{2})\)/);
        const logTimestamp = timeMatch ? timeMatch[1] : report.updatedAt || report.timestamp;

        const cleanLog = log.replace(/\s*\(\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{2}\)\s*$/, "").trim();

        const uploaderNameCapitalized = getCleanName(report.uploaderName);
        let description = "";
        
        const likeMatch = cleanLog.match(/^Lượt thích mới \((.*)\)$/);
        const shareMatch = cleanLog.match(/^Chia sẻ mới \((.*)\)$/) || cleanLog.match(/^Tiếp nhận mới \((.*)\)$/);
        const chatMatch = cleanLog.match(/^Tương tác bình luận mới từ (.*?)$/);
        const dirMatch = cleanLog.match(/^Chỉ đạo mới \((.*?): "(.*)"\)$/);
        const ratingMatch = cleanLog.match(/^Đánh giá mới \((.*?): (\d+) sao\)$/);
        const badgeMatch = cleanLog.match(/^Trao huy hiệu mới \((.*?): "(.*?)"\)$/);
        const revokeBadgeMatch = cleanLog.match(/^Thu hồi huy hiệu \((.*?): "(.*?)"\)$/);

        if (likeMatch) {
          const actor = getCleanName(likeMatch[1]);
          const gender = guessGenderPrefix(actor);
          const genderPrefix = gender ? `${gender} ` : "";
          description = `Bản tin của ${uploaderNameCapitalized} vừa được ${genderPrefix}@${actor} thả 1 lượt like.`;
        } else if (shareMatch) {
          const actor = getCleanName(shareMatch[1]);
          const gender = guessGenderPrefix(actor);
          const genderPrefix = gender ? `${gender} ` : "";
          description = `Bản tin của ${uploaderNameCapitalized} vừa được ${genderPrefix}@${actor} xác nhận tiếp nhận.`;
        } else if (chatMatch) {
          const actor = getCleanName(chatMatch[1]);
          const gender = guessGenderPrefix(actor);
          const genderPrefix = gender ? `${gender} ` : "";
          description = `Bản tin của ${uploaderNameCapitalized} vừa nhận bình luận tương tác từ ${genderPrefix}@${actor}.`;
        } else if (dirMatch) {
          const actor = getCleanName(dirMatch[1]);
          const content = dirMatch[2];
          const gender = guessGenderPrefix(actor);
          const genderPrefix = gender ? `${gender} ` : "";
          description = `${genderPrefix}@${actor} vừa ban hành chỉ đạo mới trên bản tin của ${uploaderNameCapitalized}: "${content}"`;
        } else if (ratingMatch) {
          const actor = getCleanName(ratingMatch[1]);
          const stars = ratingMatch[2];
          const gender = guessGenderPrefix(actor);
          const genderPrefix = gender ? `${gender} ` : "";
          description = `Bản tin của ${uploaderNameCapitalized} vừa được ${genderPrefix}@${actor} đánh giá chất lượng ${stars} sao. ⭐`;
        } else if (badgeMatch) {
          const actor = getCleanName(badgeMatch[1]);
          const badge = badgeMatch[2];
          const gender = guessGenderPrefix(actor);
          const genderPrefix = gender ? `${gender} ` : "";
          description = `Bản tin của ${uploaderNameCapitalized} vừa được ${genderPrefix}@${actor} trao tặng huy hiệu "${badge}". 🏅`;
        } else if (revokeBadgeMatch) {
          const actor = getCleanName(revokeBadgeMatch[1]);
          const badge = revokeBadgeMatch[2];
          const gender = guessGenderPrefix(actor);
          const genderPrefix = gender ? `${gender} ` : "";
          description = `Huy hiệu "${badge}" trên bản tin của ${uploaderNameCapitalized} đã bị ${genderPrefix}@${actor} thu hồi.`;
        } else if (cleanLog.includes("Sửa chi tiết") || cleanLog.includes("Sửa chi nhánh") || cleanLog.includes("Sửa hạng mục 4M1E1I") || cleanLog.includes("Sửa ghi chú") || cleanLog.includes("Thay đổi mức cảnh báo") || cleanLog.includes("Sửa ảnh")) {
          description = `Bản tin của ${uploaderNameCapitalized} tại ${report.factory} vừa thay đổi: ${cleanLog}.`;
        }

        if (!description) {
          return;
        }

        list.push({
          id: `update-${report.id}-${idx}`,
          title: "Bản tin cập nhật",
          description,
          timestamp: logTimestamp,
          type: "update_report",
          targetReportId: report.id,
          authorName: report.uploaderName,
          factoryName: report.factory
        });
      });
    } else if (report.updatedAt) {
      list.push({
        id: `update-${report.id}`,
        title: "Bản tin cập nhật",
        description: `Bản tin của ${report.uploaderName} tại ${report.factory} vừa thay đổi thông tin.`,
        timestamp: report.updatedAt,
        type: "update_report",
        targetReportId: report.id,
        authorName: report.uploaderName,
        factoryName: report.factory
      });
    }

    // 3. Directives notifications
    if (report.directives && report.directives.length > 0) {
      report.directives.forEach((dir, idx) => {
        list.push({
          id: `directive-${report.id}-${idx}`,
          title: "Chỉ đạo chất lượng mới",
          description: `${dir.author} chỉ đạo: "${dir.text.substring(0, 45)}..."`,
          timestamp: dir.timestamp,
          type: "new_directive",
          targetReportId: report.id,
          authorName: dir.author,
          factoryName: report.factory
        });
      });
    }

    // 4. Mentions in report content, notes, and directives
    if (users && users.length > 0) {
      const mentionedContent = findMentionedUsers(report.content, users);
      mentionedContent.forEach((u) => {
        list.push({
          id: `mention-report-${report.id}-${u.id}`,
          title: "📌 Bạn được nhắc đến",
          description: `${report.uploaderName} đã nhắc đến bạn trong nội dung bản tin tại ${report.factory}: "${report.content.substring(0, 45)}..."`,
          timestamp: report.timestamp,
          type: "mention",
          targetReportId: report.id,
          authorName: report.uploaderName,
          factoryName: report.factory
        });
      });

      if (report.notes) {
        const mentionedNotes = findMentionedUsers(report.notes, users);
        mentionedNotes.forEach((u) => {
          list.push({
            id: `mention-notes-${report.id}-${u.id}`,
            title: "📌 Bạn được nhắc đến",
            description: `${report.uploaderName} đã nhắc đến bạn trong ghi chú bản tin tại ${report.factory}: "${report.notes?.substring(0, 45)}..."`,
            timestamp: report.timestamp,
            type: "mention",
            targetReportId: report.id,
            authorName: report.uploaderName,
            factoryName: report.factory
          });
        });
      }

      if (report.directives && report.directives.length > 0) {
        report.directives.forEach((dir, idx) => {
          const mentionedDir = findMentionedUsers(dir.text, users);
          mentionedDir.forEach((u) => {
            list.push({
              id: `mention-directive-${report.id}-${idx}-${u.id}`,
              title: "📌 Bạn được nhắc đến",
              description: `${dir.author} đã nhắc đến bạn trong chỉ đạo bản tin tại ${report.factory}: "${dir.text.substring(0, 45)}..."`,
              timestamp: dir.timestamp,
              type: "mention",
              targetReportId: report.id,
              authorName: dir.author,
              factoryName: report.factory
            });
          });
        });
      }
    }
  });

  // 5. Mentions in Chats
  if (users && users.length > 0 && chats && Array.isArray(chats)) {
    chats.forEach((chat) => {
      if (!chat.message || !chat.reportRefId) return;
      const r = reports.find((rep) => rep.id === chat.reportRefId);
      const mentioned = findMentionedUsers(chat.message, users);
      mentioned.forEach((u) => {
        list.push({
          id: `mention-chat-${chat.id}-${u.id}`,
          title: "📌 Bạn được nhắc đến",
          description: `${chat.senderName} đã nhắc đến bạn trong thảo luận bản tin tại ${r?.factory || "Hệ thống"}: "${chat.message.substring(0, 45)}..."`,
          timestamp: chat.timestamp,
          type: "mention",
          targetReportId: chat.reportRefId,
          authorName: chat.senderName,
          factoryName: r?.factory || "Hệ thống"
        });
      });
    });
  }

  // 6. Mentions in Forum Topics
  if (users && users.length > 0 && topics && Array.isArray(topics)) {
    topics.forEach((topic) => {
      const mentioned = findMentionedUsers(topic.description, users);
      mentioned.forEach((u) => {
        list.push({
          id: `mention-topic-${topic.id}-${u.id}`,
          title: "📌 Bạn được nhắc đến",
          description: `${topic.creatorName} đã nhắc đến bạn trong chủ đề "${topic.title}": "${topic.description.substring(0, 45)}..."`,
          timestamp: topic.timestamp,
          type: "mention",
          targetReportId: undefined,
          authorName: topic.creatorName,
          factoryName: "Diễn đàn"
        });
      });
    });
  }

  // 7. Mentions in Forum Replies
  if (users && users.length > 0 && replies && Array.isArray(replies) && topics) {
    replies.forEach((reply) => {
      const topic = topics.find((t) => t.id === reply.topicId);
      const mentioned = findMentionedUsers(reply.message, users);
      mentioned.forEach((u) => {
        list.push({
          id: `mention-reply-${reply.id}-${u.id}`,
          title: "📌 Bạn được nhắc đến",
          description: `${reply.senderName} đã nhắc đến bạn trong phản hồi chủ đề "${topic?.title || "Diễn đàn"}": "${reply.message.substring(0, 45)}..."`,
          timestamp: reply.timestamp,
          type: "mention",
          targetReportId: undefined,
          authorName: reply.senderName,
          factoryName: "Diễn đàn"
        });
      });
    });
  }

  // Filter out deleted notifications
  const activeList = list.filter((n) => !deletedNotifIds.includes(n.id));

  // Sort notifications chronologically descending (newest first)
  return activeList.sort((a, b) => {
    const tA = parseReportTimestamp(a.timestamp).getTime();
    const tB = parseReportTimestamp(b.timestamp).getTime();
    return tB - tA;
  });
}
