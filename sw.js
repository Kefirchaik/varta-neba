self.addEventListener('install',event=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{const existing=clients.find(c=>new URL(c.url).origin===self.location.origin);return existing?existing.focus():self.clients.openWindow('./');}));});
