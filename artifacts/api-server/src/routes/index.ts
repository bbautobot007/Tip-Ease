import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import walletRouter from "./wallet";
import vendorsRouter from "./vendors";
import eventsRouter from "./events";
import qrCodesRouter from "./qrcodes";
import tipsRouter from "./tips";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(walletRouter);
router.use(vendorsRouter);
router.use(eventsRouter);
router.use(qrCodesRouter);
router.use(tipsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
