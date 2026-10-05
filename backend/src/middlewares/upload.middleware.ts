import multer from "multer";

const storage =
  multer.memoryStorage();

export const upload =
  multer({
    storage,

    fileFilter: (
      _req,
      file,
      cb
    ) => {

      const allowedTypes = [

        "application/pdf",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

      ];

      if (
        allowedTypes.includes(
          file.mimetype
        )
      ) {

        cb(null, true);

      } else {

        cb(
          new Error(
            "Only PDF and DOCX files are allowed"
          )
        );
      }
    },

    limits: {

      fileSize:
        20 * 1024 * 1024,

    },
  });