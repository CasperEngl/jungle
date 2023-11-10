WITH RECURSIVE CommentHierarchy AS (
  -- Anchor member: select top-level comments
  SELECT
    c.comment_id,
    c.post_id,
    c.parent_comment_id,
    c.user_id,
    c.text,
    c.created_at,
    1 AS depth
  FROM
    Comments c
  WHERE
    c.parent_comment_id IS NULL AND c.post_id = :post_id -- replace :post_id with the specific post ID

  UNION ALL

  -- Recursive member: select replies
  SELECT
    c.comment_id,
    c.post_id,
    c.parent_comment_id,
    c.user_id,
    c.text,
    c.created_at,
    ch.depth + 1
  FROM
    Comments c
  INNER JOIN CommentHierarchy ch ON c.parent_comment_id = ch.comment_id
)

-- Select from the recursive CTE
SELECT
  *
FROM
  CommentHierarchy
ORDER BY
  depth, created_at;
