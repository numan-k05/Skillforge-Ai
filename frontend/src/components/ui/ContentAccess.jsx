import { LockKeyhole, CheckCircle2 } from "lucide-react";
import { Badge } from "./Card.jsx";
import Button from "./Button.jsx";

export const unlockPath=item=>item.requiredProducts?.length?`/store?productId=${item.requiredProducts[0].id}`:"/store";
export function AccessBadge({item}){return item.hasAccess===false?<Badge tone="amber"><LockKeyhole size={14}/> Locked · paid access</Badge>:<Badge tone="teal"><CheckCircle2 size={14}/>{item.isPremium?"Unlocked":"Free"}</Badge>;}
export function UnlockButton({item}){return <Button to={unlockPath(item)} variant="secondary" icon={<LockKeyhole size={14}/>}>View unlock options</Button>;}
