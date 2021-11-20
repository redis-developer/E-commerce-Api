import express, { Request, response, Response } from "express";
import { Usersvalidate } from "../../middlewares/authorization";
const router = express.Router();
const { ratingDetail } = require("../../middlewares/validation");
const client = require("../../config/database");
const { ratingid } = require("../../controller/generateId");

router.post(
  "/ratings/:pid",
  Usersvalidate,
  ratingDetail,
  async (req: Request, res: Response) => {
    const { rating, comment } = req.body;
    const { pid } = req.params;
    const uid = req.session.userid;

    if (!pid) {
      return res.status(400).json({ err: "Please Provide the postID" });
    }

    let query = "SELECT rid FROM ratings WHERE pid=$1 AND userid =$2";
    const getrid = await client.query(query, [pid, uid]);
    if (getrid.rowCount != 0) {
      return res.status(400).json({ err: "Already Rated This Product" });
    }

    try {
      await client.query("BEGIN");
      const rid = await ratingid();
      const date = new Date();

      let query =
        "INSERT INTO ratings(rid,pid,userid,rating_number,comment,submitted)VALUES($1,$2,$3,$4,$5,$6)";

      const postRatings = await client.query(query, [
        rid,
        pid,
        uid,
        rating,
        comment,
        date,
      ]);

      await client.query("COMMIT");
      return res.status(200).json({ success: "Rating Added" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.log(err);
      res.status(400).json({ err: err });
    }
  }
);

router.delete(
  "/ratings/:pid",
  Usersvalidate,
  async (req: Request, res: Response) => {
    const { pid } = req.params;
    const userid = req.session.userid;
    if (!pid) {
      return res.status(400).json({ err: "Please Provide the postID" });
    }

    try {
      await client.query("BEGIN");
      let query = "DELETE FROM ratings WHERE userid =$1 AND pid =$2";

      const delRating = await client.query(query, [userid, pid]);
      await client.query("COMMIT");
      res.status(200).json({ success: "Rating Deleted" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.log(err);
      res.status(400).json({ err: "Failed to Delete Ratings" });
    }
  }
);

//UPDATE Rating Of A Productd
router.put(
  "/ratings/:pid",
  Usersvalidate,
  ratingDetail,
  async (req: Request, res: Response) => {
    const { rating, comment } = req.body;
    const { pid } = req.params;
    const userid = req.session.userid;

    if (!pid) {
      return res.status(400).json({ err: "Please Provide the postID" });
    }
    try {
      await client.query("BEGIN");
      let query =
        "UPDATE ratings SET rating_number=$1,comment=$2 WHERE userid=$3 AND pid=$4";
      const updateRating = await client.query(query, [
        rating,
        comment,
        userid,
        pid,
      ]);
      await client.query("COMMIT");
      res.status(200).json({ success: "Updated Rating" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.log(err);
      res.status(400).json({ err: "Faile To Update Rating" });
    }
  }
);

//Get Ratings OF A Product
router.get("/ratings/:pid", async (req: Request, res: Response) => {
  const { pid } = req.params;
  if (!pid) {
    return res.status(400).json({ err: "Please Provide the postID" });
  }

  let query =
    "SELECT ROUND(AVG(rating_number),2) AS rating from ratings WHERE pid=$1";
  const getRatings = await client.query(query, [pid]);

  let rating = getRatings.rows?.[0].rating;
  res.status(200).json({ rating: rating });
});

module.exports = router;