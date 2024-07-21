/* eslint-disable prettier/prettier */
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const mapModel = require('../models/mapModel');
const userModel = require('../models/userModel');

async function sendInvitationEmail(
  inviteesEmail,
  confirmationLink,
  inviteesName,
  user
) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  await transporter.verify();

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: inviteesEmail,
    subject: `您好${inviteesName},歡迎來到 Viajar, 您受到${user}的邀請共同編輯地圖!`,
    html: `
      <h2>您好${inviteesName},歡迎來到 <span style="color:#00b7a2;">Viajar</span>。</h2>
      <div>請點以下連結獲取地圖編輯權：</div>
      <a href="${confirmationLink}">${confirmationLink}</a>
      <br>
      <br>
      <div><span style="color:#00b7a2;">Viajar</span>歡迎您~</div>
      `,
  };

  await transporter.sendMail(mailOptions);
}

async function getMapById(req, res) {
  const { mapId } = req.query;

  try {
    const mapInfo = await mapModel.findMapById(mapId);
    res.status(200).json(mapInfo);
  } catch (error) {
    res.status(500).json({ success: false, error: '無法獲取地圖資訊' });
  }
}

async function getMapsByUser(req, res) {
  const { loginUserId } = req.query;

  try {
    const maps = await mapModel.findMapsByUser(loginUserId);
    res.status(200).json(maps);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: 'Could not fetch the documents' });
  }
}

async function createMap(req, res) {
  const mapRoomInfo = req.body;

  if (mapRoomInfo.roomName === '') {
    return res.status(404).json({ success: false, error: '地圖名稱不能為空' });
  }

  try {
    const result = await mapModel.insertMap(mapRoomInfo);
    res.status(201).json({
      result,
      success: true,
      message: '上傳地圖成功! 請點擊地圖清單',
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: 'Could not create a new document' });
  }
}

async function inviteToMap(req, res) {
  const { mapId, loginUserId, inviteesMail } = req.body;

  try {
    if (mapId === null) {
      return res
        .status(404)
        .json({ success: false, error: '請先選擇地圖後邀請' });
    }

    if (inviteesMail === '') {
      return res
        .status(404)
        .json({ success: false, error: '請輸入受邀者的Email地址' });
    }

    const map = await mapModel.findMapById(mapId);

    if (!map) {
      return res.status(404).json({ success: false, error: '未找到房間' });
    }

    if (map.loginUserId !== loginUserId) {
      return res
        .status(403)
        .json({ success: false, error: '您無權邀請使用者存取此地圖' });
    }

    const newInvitees = await userModel.findUserByEmail(inviteesMail);

    if (!newInvitees) {
      return res.status(403).json({
        success: false,
        error: '找不到信箱，或是信箱輸入錯誤',
      });
    }

    const confirmationLink = `${process.env.HOST}/api/maps/confirm?roomId=${mapId}&invitees=${newInvitees._id}`;

    const newUserInfo = await userModel.findUserById(loginUserId);

    await sendInvitationEmail(
      newInvitees.email,
      confirmationLink,
      newInvitees.name,
      newUserInfo.name
    );

    res.status(200).json({ success: true, message: '地圖分享成功!' });
  } catch (error) {
    res.status(500).json({ success: false, error: '無法發送邀請' });
  }
}

async function confirmInvitation(req, res) {
  const { roomId, invitees } = req.query;

  try {
    await mapModel.addInviteeToMap(roomId, invitees);
    res.status(200).redirect(`${process.env.HOST}/?mapId=${roomId}`);
  } catch (error) {
    res.status(500).json({ error: '無法更新文檔' });
  }
}

async function searchMaps(req, res) {
  try {
    const { keyword } = req.query;

    if (keyword === '') {
      return res
        .status(400)
        .json({ success: false, error: '請輸入搜尋關鍵字' });
    }

    const maps = await mapModel.searchMaps(keyword);

    if (maps.length === 0) {
      return res.status(400).json({ success: false, error: '查無地圖' });
    }

    res.status(200).json(maps);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: 'Could not fetch the documents' });
  }
}

async function getMatchingMaps(req, res) {
  const { loginUserId, mapId } = req.query;

  try {
    const maps = await mapModel.findMatchingMaps(loginUserId, mapId);
    res.status(200).json(maps);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch the documents' });
  }
}

async function deleteMap(req, res) {
  const { _id } = req.body;

  try {
    const result = await mapModel.deleteMapById(_id);
    res.status(200).json({ result, success: true, message: '地圖已刪除' });
    //  req.io.emit('deleteMap', _id);尚未用到
  } catch (error) {
    res.status(500).json({ error: 'Could not delete the document' });
  }
}

module.exports = {
  getMapById,
  getMapsByUser,
  createMap,
  inviteToMap,
  confirmInvitation,
  searchMaps,
  getMatchingMaps,
  deleteMap,
};
